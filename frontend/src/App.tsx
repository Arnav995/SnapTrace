// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HostDashboard } from './pages/HostDashboard';
import { GuestPortal } from './pages/GuestPortal';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/event/:eventId" element={<GuestPortal />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;