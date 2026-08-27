import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { EventDropzone } from '../components/EventDropzone';

interface EventData {
  id: string;
  name: string;
  date: string;
}    

export const HostDashboard: React.FC = () => {
  const [events, setEvents] = useState<EventData[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [newEventName, setNewEventName] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Failed to fetch events', error);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;

    try {
      const response = await axios.post('http://localhost:5000/api/events', {
        title: newEventName,
        date: new Date().toISOString(),
      });

      const newEvent = response.data.event;
      setEvents([newEvent, ...events]);
      setNewEventName('');
      setSelectedEvent(newEvent);
    } catch (error) {
      console.error('Failed to create event', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 bg-white border-r border-gray-200 p-6 flex flex-col">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-6">📸 SpotMe Host</h1>

        <form onSubmit={handleCreateEvent} className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Create New Event</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newEventName}
              onChange={(e) => setNewEventName(e.target.value)}
              placeholder="e.g., Tech Conference 2026"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition"
            >
              Add
            </button>
          </div>
        </form>

        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Your Events</h2>
        <div className="flex-1 overflow-y-auto space-y-2">
          {events.length === 0 ? (
            <p className="text-gray-400 text-sm italic">No events yet. Create one above.</p>
          ) : (
            events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                  selectedEvent?.id === event.id
                    ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700'
                    : 'bg-white hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-semibold">{event.name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(event.date).toLocaleDateString()}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full md:w-2/3 p-8 flex flex-col items-center justify-center bg-gray-50">
        {!selectedEvent ? (
          <div className="text-center text-gray-400">
            <h3 className="text-xl font-medium">Select an event to start</h3>
            <p className="mt-2">Choose an event from the sidebar or create a new one to upload photos.</p>
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">{selectedEvent.name}</h2>
              <p className="text-gray-500">ID: {selectedEvent.id}</p>
            </div>

            <EventDropzone eventId={selectedEvent.id} />
          </div>
        )}
      </div>
    </div>
  );
};