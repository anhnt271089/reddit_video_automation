import Fastify from 'fastify';
import testScriptsRoutes from './routes/test-scripts.js';

const fastify = Fastify({ 
  logger: {
    level: 'info'
  }
});

// Register test routes
fastify.register(testScriptsRoutes, { prefix: '/api' });

// Basic health check
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Test server running on http://localhost:${port}`);
    console.log('📝 Test endpoints:');
    console.log('  - POST /api/test-script-generation - Test Claude Code script generation');
    console.log('  - POST /api/test-prompt-generation - View the prompt sent to Claude Code');
    console.log('  - GET /api/test-script-health - Health check for script service');
    console.log('  - GET /health - Basic server health');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();