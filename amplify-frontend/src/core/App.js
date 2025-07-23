import { Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from '../context/SessionContext';
import ProtectedRoute from '../components/ProtectedRoute';
import DashboardPage from '../sections/Dashboard';
import Upload from '../pages/Upload';
import Explore from '../sections/Explore';
import Projects, { ProjectDetails } from '../sections/Projects';
import NotFound from '../pages/NotFound';
import SingleDatasetOverview from '../sections/Explore/SingleDatasetOverview';
import Login from '../pages/Login';

function App() {
  return (
    <SessionProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="/upload" element={
          <ProtectedRoute>
            <Upload />
          </ProtectedRoute>
        } />
        <Route path="/explore" element={
          <ProtectedRoute>
            <Explore />
          </ProtectedRoute>
        } />
        <Route path="/explore/dataset" element={
          <ProtectedRoute>
            <SingleDatasetOverview />
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        } />
        <Route path="/projects/details" element={
          <ProtectedRoute>
            <ProjectDetails />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SessionProvider>
  );
}

export default App;
