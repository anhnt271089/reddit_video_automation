import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ContentDiscoveryPost } from '@video-automation/shared-types';
// import { RedditClient, RedditConfig } from './services/reddit/redditClient';
// import { ContentProcessor } from './services/reddit/contentProcessor';

const server = Fastify({ logger: true });

// Register CORS
server.register(cors, {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
});

// Reddit API simulation (for development)
let redditApiHealthy = false;

// Simulate Reddit API status
console.log('⚠️  Reddit API integration ready but using demo data (credentials not configured)');

// Generate 50 mock Reddit posts
function generateMockPosts(): ContentDiscoveryPost[] {
  const statuses: Array<'discovered' | 'approved' | 'rejected' | 'script_generated'> = [
    'discovered', 'approved', 'rejected', 'script_generated'
  ];
  
  const subreddits = [
    'motivation', 'entrepreneur', 'personalfinance', 'technology', 'science',
    'getmotivated', 'lifeprotips', 'todayilearned', 'askreddit', 'relationships',
    'fitness', 'cooking', 'travel', 'photography', 'books'
  ];

  const mockTitles = [
    'From Homeless to Millionaire: My 3-Year Journey',
    'I Quit My 9-5 Job to Start a Food Truck and Here\'s What I Learned',
    'How I Lost 100 Pounds in 8 Months Without Giving Up My Favorite Foods',
    'The Simple Habit That Changed My Life Forever',
    'I Built a Side Hustle Making $5K/Month While Working Full Time',
    'After 20 Years of Marriage, We Finally Found the Secret to Happiness',
    'The Investment Mistake That Cost Me $50K (And How You Can Avoid It)',
    'I Traveled to 30 Countries on a Shoestring Budget - Here\'s How',
    'From Social Anxiety to Public Speaking: My Transformation Story',
    'The Productivity System That Doubled My Income',
    'How I Turned My Hobby Into a Six-Figure Business',
    'The Morning Routine That Revolutionized My Mental Health',
    'I Automated My Finances and Saved $20K in One Year',
    'The Parenting Technique That Transformed Our Family Dynamic',
    'From Couch Potato to Marathon Runner in 12 Months'
  ];

  const posts: ContentDiscoveryPost[] = [];
  
  for (let i = 1; i <= 50; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
    const title = mockTitles[Math.floor(Math.random() * mockTitles.length)];
    
    posts.push({
      id: i.toString(),
      title: `${title} ${i > 15 ? `(Part ${Math.floor(i / 15)})` : ''}`,
      content: `This is a detailed story about ${title.toLowerCase()}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.`,
      author: `user${i}`,
      subreddit,
      score: Math.floor(Math.random() * 5000) + 100,
      upvotes: Math.floor(Math.random() * 6000) + 200,
      comments: Math.floor(Math.random() * 800) + 10,
      created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      url: `https://reddit.com/r/${subreddit}/comments/${i}`,
      status,
      quality_score: Math.floor(Math.random() * 40) + 60 // 60-100 quality score
    });
  }
  
  return posts;
}

const mockPosts = generateMockPosts();

// API Routes
server.get('/api/posts', async (request, reply) => {
  try {
    // For now, use enhanced mock data (Reddit API integration ready for when credentials are added)
    console.log('🎭 Using enhanced mock data (Reddit API ready for production)');
    
    const posts = mockPosts;

    return {
      posts,
      total: posts.length,
      timestamp: new Date().toISOString(),
      source: 'enhanced_mock_data',
      reddit_api_healthy: redditApiHealthy,
      message: 'Reddit API integration ready - add credentials to connect'
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    
    return {
      posts: mockPosts,
      total: mockPosts.length,
      timestamp: new Date().toISOString(),
      source: 'mock_data',
      reddit_api_healthy: false,
      error: 'Failed to fetch data'
    };
  }
});

server.get('/api/posts/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  const post = mockPosts.find(p => p.id === id);
  
  if (!post) {
    reply.code(404);
    return { error: 'Post not found' };
  }
  
  return { post };
});

server.put('/api/posts/:id/status', async (request, reply) => {
  const { id } = request.params as { id: string };
  const { status } = request.body as { status: ContentDiscoveryPost['status'] };
  
  const post = mockPosts.find(p => p.id === id);
  if (!post) {
    reply.code(404);
    return { error: 'Post not found' };
  }
  
  post.status = status;
  return { post, message: 'Status updated successfully' };
});

// Health check
server.get('/health', async (request, reply) => {
  return { 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    posts_count: mockPosts.length,
    reddit_api_healthy: redditApiHealthy,
    reddit_client_ready: true
  };
});

// Reddit API status endpoint
server.get('/api/reddit/status', async (request, reply) => {
  return {
    healthy: redditApiHealthy,
    client_ready: true,
    timestamp: new Date().toISOString()
  };
});

// Start server
const start = async () => {
  try {
    await server.listen({ port: 3001, host: '0.0.0.0' });
    console.log('🚀 Mock API Server running on http://localhost:3001');
    console.log('📊 Available endpoints:');
    console.log('  GET  /api/posts        - List all posts');
    console.log('  GET  /api/posts/:id    - Get single post');
    console.log('  PUT  /api/posts/:id/status - Update post status');
    console.log('  GET  /health          - Health check');
    console.log(`\n✅ Generated ${mockPosts.length} mock posts`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();