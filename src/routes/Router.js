import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './sections/Dashboard';
import Upload from './pages/Upload';
import Explore from './sections/Explore';
import Projects, { ProjectDetails } from './sections/Projects';
import CreateProject from './pages/CreateProject';
import TestCreateProject from './pages/TestCreateProject';
import NotFound from './pages/NotFound';
import SingleDatasetOverview from './sections/Explore/SingleDatasetOverview';
import SingleProject from './sections/Projects/SingleProject';
import ProjectVisualization from './sections/Projects/ProjectVisualization';
import ProjectNotebookIDE from './pages/ProjectNotebookIDE';
import Settings from './pages/Settings';
import TestNavigationPage from './pages/TestNavigationPage';

function Router() {
  console.log('Router loaded: routes are being rendered');
  return (
    <Routes>
      {console.log('Rendering route: /')}
      <Route path="/" element={<DashboardPage />} />
      {console.log('Rendering route: /dashboard')}
      <Route path="/dashboard" element={<DashboardPage />} />
      {console.log('Rendering route: /upload')}
      <Route path="/upload" element={<Upload />} />
      {console.log('Rendering route: /explore/*')}
      <Route path="/explore/*" element={<Explore />} />
      {console.log('Rendering route: /projects')}
      <Route path="/projects" element={<Projects />} />
      {console.log('Rendering route: /projects/create')}
      <Route path="/projects/create" element={<CreateProject />} />
      {console.log('Rendering route: /test-create-project')}
      <Route path="/test-create-project" element={<TestCreateProject />} />
      {console.log('Rendering route: /projects/details')}
      <Route path="/projects/details" element={<ProjectDetails />} />
      {console.log('Rendering route: /projects/:id')}
      <Route path="/projects/:id" element={<SingleProject />} />
      {console.log('Rendering route: /projects/:id/visualization')}
      <Route path="/projects/:id/visualization" element={<ProjectVisualization />} />
      // ...existing code...
      {console.log('Rendering route: /test-navigation')}
      <Route path="/test-navigation" element={<TestNavigationPage />} />
      {console.log('Rendering route: /settings')}
      <Route path="/settings" element={<Settings />} />
      {console.log('Rendering route: * (NotFound)')}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default Router;
