import { useParams } from 'react-router-dom';
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

export function ScriptWorkflow() {
  const { scriptId } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Script Workflow</h1>
          <p className="text-muted-foreground">
            {scriptId
              ? `Script ID: ${scriptId}`
              : 'Script generation and review workflow'}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">Save Draft</Button>
          <Button>Approve Script</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Script</CardTitle>
              <CardDescription>
                AI-generated video script based on the Reddit post
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">Opening Hook (0:00 - 0:05)</h3>
                <p className="text-sm">
                  "What if I told you that AI is revolutionizing healthcare in
                  ways you never imagined? In the next 60 seconds, I'll show you
                  three breakthrough technologies that are saving lives right
                  now."
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Main Content (0:05 - 0:45)</h3>
                <p className="text-sm">
                  "First, AI diagnostic imaging is catching cancer 20% earlier
                  than human doctors. Google's AI can detect diabetic
                  retinopathy with 90% accuracy in just seconds. Second, AI drug
                  discovery has cut development time from 15 years to just 3
                  years..."
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Call to Action (0:45 - 0:60)</h3>
                <p className="text-sm">
                  "The future of healthcare is here. Follow for more AI
                  breakthroughs that are changing our world. Which AI healthcare
                  application surprised you most? Let me know in the comments!"
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Total Duration: 60 seconds
                </div>
                <Badge variant="default">Generated</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Script Modifications</CardTitle>
              <CardDescription>
                Edit the script to improve flow and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  className="w-full h-32 px-3 py-2 text-sm border rounded-md resize-none"
                  placeholder="Add your modifications or notes here..."
                />
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    Reset
                  </Button>
                  <Button size="sm">Apply Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Script Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Generation</span>
                  <Badge variant="default">Complete</Badge>
                </div>
                <Progress value={100} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Review</span>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                <Progress value={60} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Asset Matching</span>
                  <Badge variant="outline">Pending</Badge>
                </div>
                <Progress value={0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <h4 className="font-medium text-sm">
                The Revolutionary Impact of AI on Modern Healthcare
              </h4>
              <p className="text-xs text-muted-foreground">
                r/technology • u/healthtech_researcher
              </p>
              <div className="text-xs text-muted-foreground">
                Score: 1,247 • 89 comments
              </div>
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Original Post
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                Regenerate Script
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                Find Assets
              </Button>
              <Button className="w-full" size="sm">
                Proceed to Assets
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
