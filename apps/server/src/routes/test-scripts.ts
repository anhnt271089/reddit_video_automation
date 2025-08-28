import { FastifyPluginCallback } from 'fastify';
import { ClaudeCodeScriptGenerator } from '../services/claude-code';
import type { 
  ScriptGenerationRequest,
  ScriptStyle 
} from '../services/claude-code/types';

const testScriptsRoutes: FastifyPluginCallback = (fastify, options, done) => {
  const scriptGenerator = new ClaudeCodeScriptGenerator();

  // Test endpoint for Claude Code integration
  fastify.post<{
    Body: {
      title?: string;
      content?: string;
      targetDuration?: number;
      style?: ScriptStyle;
    }
  }>('/test-script-generation', async (request, reply) => {
    try {
      const { 
        title = "Amazing Success Story: From Zero to Hero",
        content = "I was broke and homeless two years ago. Today I bought my first house and started my own business. Here's how I did it step by step. First, I had to change my mindset completely. I stopped making excuses and started taking action every single day. The journey wasn't easy - there were countless obstacles and moments when I wanted to give up. But I persisted, learned new skills, and slowly built my way up from nothing.",
        targetDuration = 60,
        style = 'motivational'
      } = request.body;

      // Create a mock Reddit post for testing
      const mockRedditPost = {
        id: 'test_post_123',
        title,
        content,
        author: 'testuser',
        subreddit: 'motivation',
        score: 250,
        upvotes: 320,
        comments: 45,
        created_at: new Date(),
        url: 'https://reddit.com/r/motivation/comments/test_post_123'
      };

      const generationRequest: ScriptGenerationRequest = {
        redditPost: mockRedditPost,
        targetDuration,
        style
      };

      fastify.log.info('Starting script generation with Claude Code...');
      
      const script = await scriptGenerator.generateScript(generationRequest);
      
      fastify.log.info('Script generation completed successfully');

      reply.send({ 
        success: true, 
        script,
        message: 'Script generated successfully using Claude Code integration'
      });
    } catch (error) {
      fastify.log.error(`Script generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // For testing purposes, return the error details
      reply.code(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'This error is expected during development - it shows the Claude Code integration point',
        nextSteps: 'Claude Code will process the structured prompt and return a JSON response'
      });
    }
  });

  // Test endpoint to see the prompt that would be sent to Claude Code
  fastify.post<{
    Body: {
      title?: string;
      content?: string;
      targetDuration?: number;
      style?: ScriptStyle;
    }
  }>('/test-prompt-generation', async (request, reply) => {
    try {
      const { 
        title = "Amazing Success Story: From Zero to Hero",
        content = "I was broke and homeless two years ago. Today I bought my first house and started my own business.",
        targetDuration = 60,
        style = 'motivational'
      } = request.body;

      // Import prompt templates
      const { PromptTemplates } = await import('../services/claude-code/prompts.js');
      
      const systemPrompt = PromptTemplates.getSystemPrompt(style);
      const userPrompt = PromptTemplates.getScriptGenerationPrompt(
        title,
        content,
        targetDuration,
        4, // scene count
        style
      );

      reply.send({
        success: true,
        systemPrompt,
        userPrompt,
        fullPrompt: `${systemPrompt}\n\n${userPrompt}`,
        message: 'This is the prompt that will be sent to Claude Code for processing'
      });
    } catch (error) {
      fastify.log.error(`Prompt generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.code(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Health check for script service
  fastify.get('/test-script-health', async (request, reply) => {
    try {
      const { ContentProcessor } = await import('../services/claude-code/contentProcessor.js');
      const processor = new ContentProcessor();
      
      // Test content processing
      const testPost = {
        id: 'test',
        title: 'Test Title',
        content: 'Test content for health check',
        author: 'test',
        subreddit: 'test',
        score: 100,
        upvotes: 150,
        comments: 20,
        created_at: new Date(),
        url: 'https://test.com'
      };

      const processed = processor.preprocessPost(testPost);
      const score = processor.scoreContent(testPost);
      const flags = processor.detectContentFlags(testPost);

      reply.send({
        success: true,
        message: 'Claude Code script service is healthy',
        tests: {
          contentProcessing: !!processed,
          contentScoring: typeof score === 'number',
          flagDetection: Array.isArray(flags)
        },
        results: {
          processed,
          score,
          flags
        }
      });
    } catch (error) {
      fastify.log.error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.code(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  done();
};

export default testScriptsRoutes;