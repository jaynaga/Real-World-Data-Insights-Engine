import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Explore from './sections/Explore';
import SingleDatasetOverview from './sections/Explore/SingleDatasetOverview';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Upload from './pages/Upload';
import FUJIIntegrationDemo from './pages/FUJIIntegrationDemo';

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/explore/:datasetId" element={<SingleDatasetOverview />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/fuji-demo" element={<FUJIIntegrationDemo />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </BrowserRouter>
  );
}