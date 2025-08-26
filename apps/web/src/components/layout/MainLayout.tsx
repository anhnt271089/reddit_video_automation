import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useWebSocket } from '../../hooks/useWebSocket';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  // Initialize WebSocket connection
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
  useWebSocket(wsUrl);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
