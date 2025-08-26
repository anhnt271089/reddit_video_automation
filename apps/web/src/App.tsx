import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { ContentReview } from './pages/ContentReview';
import { ScriptWorkflow } from './pages/ScriptWorkflow';
import { AssetManagement } from './pages/AssetManagement';
import { VideoLibrary } from './pages/VideoLibrary';

function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/content" element={<ContentReview />} />
          <Route path="/scripts" element={<ScriptWorkflow />} />
          <Route path="/scripts/:scriptId" element={<ScriptWorkflow />} />
          <Route path="/assets/:scriptId" element={<AssetManagement />} />
          <Route path="/videos" element={<VideoLibrary />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}

export default App;
