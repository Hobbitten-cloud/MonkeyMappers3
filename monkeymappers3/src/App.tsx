import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { MapStats } from './pages/MapStats';
import { Changelogs } from './pages/Changelogs';
import { Participants } from './pages/Participants';
import { MapItems } from './pages/MapItems';
import { MapLocations } from './pages/MapLocations';
import { MonkeyHistory } from './pages/MonkeyHistory';
import { Admin } from './pages/Admin';

export const App: React.FC = () => {
  return (
    <div className="bg-dark text-light min-vh-100" style={{ backgroundColor: '#0c0f12' }}>
      <BrowserRouter>
        <Navbar />
        <main className="pb-5">
          <Routes>
            <Route path="/" element={<MapStats />} />
            <Route path="/changelogs" element={<Changelogs />} />
            <Route path="/participants" element={<Participants />} />
            <Route path="/items" element={<MapItems />} />
            <Route path="/locations" element={<MapLocations />} />
            <Route path="/MonkeyHistory" element={<MonkeyHistory />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </BrowserRouter>
    </div>
  );
};

export default App;