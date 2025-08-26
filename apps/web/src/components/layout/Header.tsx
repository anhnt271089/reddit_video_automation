import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useAppStore } from '../../stores/useAppStore';

export function Header() {
  const { connectionState } = useAppStore();

  const getConnectionBadge = () => {
    switch (connectionState) {
      case 'connected':
        return <Badge variant="default">Connected</Badge>;
      case 'connecting':
        return <Badge variant="secondary">Connecting...</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive">Connection Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                VA
              </span>
            </div>
            <h1 className="text-xl font-semibold">Video Automation</h1>
          </div>
        </div>

        <div className="flex-1" />

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">WebSocket:</span>
            {getConnectionBadge()}
          </div>

          <div className="h-6 w-px bg-border" />

          <Button variant="ghost" size="sm">
            Settings
          </Button>

          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-secondary-foreground text-sm font-medium">
              U
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
