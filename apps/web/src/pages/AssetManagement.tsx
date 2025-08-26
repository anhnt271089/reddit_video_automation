import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function AssetManagement() {
  const { scriptId } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Management</h1>
          <p className="text-muted-foreground">
            {scriptId ? `Managing assets for script ${scriptId}` : 'Select and organize media assets for video generation'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Search More Assets</Button>
          <Button>Generate Video</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🏥</div>
                    <p className="text-sm text-muted-foreground">Medical Image</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Modern Hospital Interior</h4>
                  <p className="text-xs text-muted-foreground">High-tech medical facility with AI equipment</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="default">Selected</Badge>
                    <span className="text-xs text-muted-foreground">0:00-0:05</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🧠</div>
                    <p className="text-sm text-muted-foreground">AI Brain Scan</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">AI Diagnostic Imaging</h4>
                  <p className="text-xs text-muted-foreground">Neural network analyzing medical scans</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Available</Badge>
                    <span className="text-xs text-muted-foreground">Suggested: 0:05-0:15</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">💊</div>
                    <p className="text-sm text-muted-foreground">Drug Research</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Laboratory Research</h4>
                  <p className="text-xs text-muted-foreground">Scientists working on drug discovery</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="default">Selected</Badge>
                    <span className="text-xs text-muted-foreground">0:15-0:30</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">👨‍⚕️</div>
                    <p className="text-sm text-muted-foreground">Doctor & Patient</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Medical Consultation</h4>
                  <p className="text-xs text-muted-foreground">Doctor explaining diagnosis to patient</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Available</Badge>
                    <span className="text-xs text-muted-foreground">Suggested: 0:30-0:45</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">📱</div>
                    <p className="text-sm text-muted-foreground">Health App</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">Mobile Health Technology</h4>
                  <p className="text-xs text-muted-foreground">AI-powered health monitoring app</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">Available</Badge>
                    <span className="text-xs text-muted-foreground">Suggested: 0:45-0:60</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-primary">
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-100 rounded-t-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔬</div>
                    <p className="text-sm text-muted-foreground">Research Lab</p>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-semibold text-sm">AI Research Facility</h4>
                  <p className="text-xs text-muted-foreground">Advanced AI and robotics laboratory</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="default">Selected</Badge>
                    <span className="text-xs text-muted-foreground">0:45-0:60</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selection Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Selected Assets: 3</div>
                <div className="text-sm text-muted-foreground">
                  Total Duration: 45 seconds
                </div>
                <div className="text-sm text-muted-foreground">
                  Missing: 15 seconds
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="text-sm font-medium">Segments Covered:</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Opening (0:00-0:05)</span>
                    <Badge variant="default" className="text-xs">✓</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Content 1 (0:05-0:30)</span>
                    <Badge variant="default" className="text-xs">✓</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Content 2 (0:30-0:45)</span>
                    <Badge variant="destructive" className="text-xs">Missing</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Closing (0:45-0:60)</span>
                    <Badge variant="default" className="text-xs">✓</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Background Music</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="p-3 border rounded-lg cursor-pointer hover:bg-accent">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Uplifting Corporate</div>
                      <div className="text-xs text-muted-foreground">60s • Instrumental</div>
                    </div>
                    <Badge variant="default">Selected</Badge>
                  </div>
                </div>
                
                <div className="p-3 border rounded-lg cursor-pointer hover:bg-accent">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Tech Innovation</div>
                      <div className="text-xs text-muted-foreground">60s • Electronic</div>
                    </div>
                    <Badge variant="outline">Available</Badge>
                  </div>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="w-full">
                Browse More Music
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                Auto-Fill Missing
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Preview Timeline
              </Button>
              <Button className="w-full" size="sm" disabled>
                Generate Video
                <span className="ml-1 text-xs">(Missing assets)</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}