import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';

interface EventDropzoneProps {
  eventId: string;
  
}

export const EventDropzone: React.FC<EventDropzoneProps> = ({ eventId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress({ current: 0, total: acceptedFiles.length });
    setStatusMessage('Requesting secure upload URLs...');

    try {
      // STEP 1: Ask Express for the S3 Presigned URLs
      const fileMetadata = acceptedFiles.map(file => ({
        fileName: file.name,
        fileType: file.type
      }));

      const { data: urlResponse } = await axios.post(
        `http://localhost:5000/api/events/${eventId}/upload-url/batch`,
        { files: fileMetadata }
      );

      const uploadInstructions = urlResponse.data;
      const successfulUploads = [];

      setStatusMessage('Uploading files directly to S3...');

      // STEP 2: Upload directly to S3 (Bypassing Express)
      // Using a standard for-loop to avoid overloading the browser network tab, 
      // but you could use Promise.all() for smaller batches.
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const instruction = uploadInstructions[i];

        await axios.put(instruction.uploadUrl, file, {
          headers: {
            'Content-Type': file.type,
          }
        });

        successfulUploads.push({
          photoId: instruction.photoId,
          publicUrl: instruction.publicUrl
        });

        setUploadProgress({ current: i + 1, total: acceptedFiles.length });
      }

      setStatusMessage('Confirming uploads with server & waking AI...');

      // STEP 3: Confirm with Express so it saves to DB and triggers Python BullMQ
      await axios.post(
        `http://localhost:5000/api/events/${eventId}/upload-confirm`,
        { uploadedPhotos: successfulUploads }
      );

      setStatusMessage('Upload complete! The AI is now processing faces.');
      
    } catch (error) {
      console.error("Upload pipeline failed:", error);
      setStatusMessage('An error occurred during upload. Check console.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(null), 3000); // Clear progress after 3s
    }
  }, [eventId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'], 'image/webp': ['.webp'] }
  });

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Upload Event Photos</h2>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-500 font-semibold">Drop the files here ...</p>
        ) : (
          <p className="text-gray-500 text-lg">
            Drag & drop high-res event photos here, or click to select files.
          </p>
        )}
      </div>

      {uploadProgress && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{statusMessage}</span>
            <span>{uploadProgress.current} / {uploadProgress.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};