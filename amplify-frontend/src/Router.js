import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './sections/Dashboard';
import Upload from './pages/Upload';
import Explore from './sections/Explore';
import Projects, { ProjectDetails } from './sections/Projects';
import NotFound from './pages/NotFound';
import SingleDatasetOverview from './sections/Explore/SingleDatasetOverview';

function Router() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/explore/dataset" element={<SingleDatasetOverview />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/details" element={<ProjectDetails />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default Router;
