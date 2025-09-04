import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { ContentReview } from './pages/ContentReview';
import { Scripts } from './pages/Scripts';
import { ScriptWorkflow } from './pages/ScriptWorkflow';
import { AssetManagement } from './pages/AssetManagement';
import { VideoLibrary } from './pages/VideoLibrary';
import { WebSocketProvider } from './contexts/WebSocketContext';

function App() {
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';

  return (
    <WebSocketProvider url={wsUrl}>
      <Router>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/content-review" element={<ContentReview />} />
            <Route path="/scripts" element={<Scripts />} />
            <Route path="/scripts/:scriptId" element={<ScriptWorkflow />} />
            <Route path="/assets/:scriptId" element={<AssetManagement />} />
            <Route path="/videos" element={<VideoLibrary />} />
          </Routes>
        </MainLayout>
      </Router>
    </WebSocketProvider>
  );
}

export default App;
