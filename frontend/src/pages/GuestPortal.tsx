// src/pages/GuestPortal.tsx
import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface MatchedPhoto {
  photo_id: string;
  s3_url: string;
  distance: number;
}

export const GuestPortal: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const webcamRef = useRef<Webcam>(null);

  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchedPhoto[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  // 1. Capture frame from live WebRTC webcam
  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
    }
  }, [webcamRef]);

  const retake = () => {
    setImgSrc(null);
    setMatches([]);
    setHasSearched(false);
  };

  // 2. Submit selfie to vector search endpoint
  const searchFaces = async () => {
    if (!imgSrc || !eventId) return;

    setIsSearching(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/events/${eventId}/search`, {
        image: imgSrc, // Base64 data URL
      });

      setMatches(response.data.matches || []);
      setHasSearched(true);
    } catch (error) {
      console.error('Face search failed:', error);
      alert('Failed to search photos. Ensure a face is clearly visible.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-blue-400">🔍 Find Your Event Photos</h1>
          <p className="text-gray-400 mt-2">Take a quick selfie to discover all your photos instantly.</p>
        </header>

        {/* CAMERA / SELFIE SECTION */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl max-w-md mx-auto mb-10 border border-gray-700">
          {!imgSrc ? (
            <div className="flex flex-col items-center">
              <div className="overflow-hidden rounded-lg mb-4 border-2 border-blue-500/50 w-full aspect-square bg-black flex items-center justify-center">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{ facingMode: 'user' }}
                />
              </div>
              <button
                onClick={capture}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-lg transition text-center"
              >
                📸 Take Selfie
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="overflow-hidden rounded-lg mb-4 border-2 border-green-500/50 w-full aspect-square bg-black">
                <img src={imgSrc} alt="Selfie preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={retake}
                  disabled={isSearching}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 font-semibold rounded-lg transition disabled:opacity-50"
                >
                  Retake
                </button>
                <button
                  onClick={searchFaces}
                  disabled={isSearching}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-500 font-bold rounded-lg transition disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Find My Photos'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RESULTS GALLERY */}
        {hasSearched && (
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-200">
              Matched Photos ({matches.length})
            </h2>

            {matches.length === 0 ? (
              <div className="text-center py-12 bg-gray-800/50 rounded-xl border border-gray-700">
                <p className="text-gray-400 text-lg">No matching photos found in this event yet.</p>
                <p className="text-gray-500 text-sm mt-1">Try retaking your selfie with good lighting.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {matches.map((photo) => (
                  <div
                    key={photo.photo_id}
                    className="group relative overflow-hidden rounded-lg bg-gray-800 aspect-square border border-gray-700 hover:border-blue-500 transition"
                  >
                    <img
                      src={photo.s3_url}
                      alt="Matched event photo"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      loading="lazy"
                    />
                    <a
                      href={photo.s3_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-xs px-3 py-1.5 rounded-md backdrop-blur-sm transition"
                    >
                      View High-Res ↗
                    </a>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};