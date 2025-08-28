import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
  description: string;
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/',
    icon: '📊',
    description: 'Overview and metrics',
  },
  {
    name: 'Content Review',
    href: '/content-review',
    icon: '📝',
    description: 'Review Reddit posts',
  },
  {
    name: 'Script Workflow',
    href: '/scripts',
    icon: '📜',
    description: 'Manage video scripts',
  },
  {
    name: 'Asset Management',
    href: '/assets/default',
    icon: '🎬',
    description: 'Organize media assets',
  },
  {
    name: 'Video Library',
    href: '/videos',
    icon: '📹',
    description: 'Manage generated videos',
  },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div
      className={cn(
        'flex flex-col border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-16 items-center px-4 border-b">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="text-sm">{isCollapsed ? '▶️' : '◀️'}</span>
        </button>
        {!isCollapsed && (
          <span className="ml-3 text-sm font-medium text-muted-foreground">
            Navigation
          </span>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map(item => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              'flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              isActive(item.href)
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground',
              isCollapsed && 'justify-center px-2'
            )}
            title={
              isCollapsed ? `${item.name}: ${item.description}` : undefined
            }
          >
            <span className="text-base">{item.icon}</span>
            {!isCollapsed && (
              <div className="ml-3">
                <div className="text-sm font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.description}
                </div>
              </div>
            )}
          </Link>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="p-4 border-t">
          <div className="rounded-lg bg-secondary/50 p-3 text-sm">
            <div className="font-medium mb-1">Pipeline Status</div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Active Jobs:</span>
                <span>2</span>
              </div>
              <div className="flex justify-between">
                <span>Queue:</span>
                <span>5</span>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="text-destructive">1</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
