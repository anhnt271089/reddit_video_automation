import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export function ContentReview() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Review</h1>
          <p className="text-muted-foreground">
            Review and approve Reddit posts for video generation
          </p>
        </div>
        <Button>Refresh Posts</Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  The Revolutionary Impact of AI on Modern Healthcare
                </CardTitle>
                <CardDescription>
                  Posted by u/healthtech_researcher in r/technology
                </CardDescription>
              </div>
              <Badge variant="secondary">Pending Review</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              Artificial intelligence is transforming healthcare in unprecedented ways. 
              From diagnostic imaging to drug discovery, AI is enabling faster, more 
              accurate, and more personalized treatment options...
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Score: 1,247</span>
                <span>Comments: 89</span>
                <span>2 hours ago</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Reject
                </Button>
                <Button size="sm">
                  Generate Script
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  Climate Change Solutions: What's Actually Working
                </CardTitle>
                <CardDescription>
                  Posted by u/climate_scientist in r/science
                </CardDescription>
              </div>
              <Badge variant="default">Approved</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              A comprehensive analysis of the most effective climate change mitigation 
              strategies currently being implemented worldwide. This post examines both 
              technological and policy solutions...
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Score: 2,156</span>
                <span>Comments: 234</span>
                <span>4 hours ago</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  View Script
                </Button>
                <Button variant="secondary" size="sm">
                  Processing...
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg">
                  Mars Mission Updates: What NASA Isn't Telling Us
                </CardTitle>
                <CardDescription>
                  Posted by u/space_explorer in r/space
                </CardDescription>
              </div>
              <Badge variant="destructive">Rejected</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              Recent developments in Mars exploration have revealed some surprising 
              findings that challenge our understanding of the red planet's potential 
              for supporting life...
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Score: 892</span>
                <span>Comments: 156</span>
                <span>6 hours ago</span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  Re-evaluate
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  Rejected
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}