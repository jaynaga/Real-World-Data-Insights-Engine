import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import Upload from './pages/Upload';
import Explore from './pages/Explore';

function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;