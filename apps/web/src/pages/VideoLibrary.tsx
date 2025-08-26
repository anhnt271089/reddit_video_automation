import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/ProgressBar';

export function VideoLibrary() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Library</h1>
          <p className="text-muted-foreground">
            Manage your generated videos and exports
          </p>
        </div>
        <Button>Export Selected</Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg mb-1">🎬</div>
                  <p className="text-xs text-muted-foreground">Video</p>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">AI Healthcare Revolution</h3>
                    <p className="text-sm text-muted-foreground">
                      Generated from: "The Revolutionary Impact of AI on Modern
                      Healthcare"
                    </p>
                  </div>
                  <Badge variant="default">Completed</Badge>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Duration: 60s</span>
                  <span>1920x1080</span>
                  <span>Size: 45.2 MB</span>
                  <span>Created: 2 hours ago</span>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                  <Button variant="outline" size="sm">
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg mb-1">⏳</div>
                  <p className="text-xs text-muted-foreground">Rendering</p>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Climate Solutions That Work
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Generated from: "Climate Change Solutions: What's Actually
                      Working"
                    </p>
                  </div>
                  <Badge variant="secondary">Rendering</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Rendering progress: 67%</span>
                    <span>ETA: 3 minutes</span>
                  </div>
                  <Progress value={67} className="h-2" />
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Duration: 58s</span>
                  <span>1920x1080</span>
                  <span>Started: 8 minutes ago</span>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" disabled>
                    Rendering...
                  </Button>
                  <Button variant="destructive" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg mb-1">❌</div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">Space Exploration Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Generated from: "Mars Mission Updates: What NASA Isn't
                      Telling Us"
                    </p>
                  </div>
                  <Badge variant="destructive">Failed</Badge>
                </div>

                <div className="text-sm text-red-600">
                  Error: Asset processing failed. Unable to generate video
                  segments.
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Duration: N/A</span>
                  <span>Failed: 1 hour ago</span>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    View Logs
                  </Button>
                  <Button size="sm">Retry</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="w-32 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg mb-1">📥</div>
                  <p className="text-xs text-muted-foreground">Queue</p>
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">
                      Future of Renewable Energy
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Generated from: "The Future of Solar and Wind Power"
                    </p>
                  </div>
                  <Badge variant="outline">Queued</Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  Position in queue: #2 • Estimated start: 12 minutes
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Duration: 55s</span>
                  <span>1920x1080</span>
                  <span>Queued: 15 minutes ago</span>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Edit Assets
                  </Button>
                  <Button variant="destructive" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>
            Recent video exports and sharing links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-sm">
                  AI Healthcare Revolution
                </div>
                <div className="text-xs text-muted-foreground">
                  Exported to YouTube • 2 hours ago
                </div>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-medium text-sm">
                  Climate Solutions That Work
                </div>
                <div className="text-xs text-muted-foreground">
                  Exported as MP4 • Yesterday
                </div>
              </div>
              <Button variant="outline" size="sm">
                Download
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
