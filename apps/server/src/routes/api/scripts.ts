import { FastifyPluginCallback } from 'fastify';
import { ClaudeCodeScriptGenerator } from '../../services/claude-code';
import type { 
  ScriptGenerationRequest,
  GeneratedScript,
  ScriptStyle 
} from '../../services/claude-code/types';

const scriptsRoutes: FastifyPluginCallback = (fastify, options, done) => {
  const scriptGenerator = new ClaudeCodeScriptGenerator();

  // Generate script from Reddit post
  fastify.post<{
    Body: {
      postId: string;
      targetDuration?: number;
      style?: ScriptStyle;
      sceneCount?: number;
    }
  }>('/scripts', async (request, reply) => {
    try {
      const { postId, targetDuration = 60, style = 'motivational', sceneCount } = request.body;

      // TODO: Fetch Reddit post from database
      // For now, we'll use a mock post structure
      const redditPost = await fetchRedditPost(postId);
      
      if (!redditPost) {
        return reply.code(404).send({ 
          success: false, 
          error: 'Reddit post not found' 
        });
      }

      const generationRequest: ScriptGenerationRequest = {
        redditPost,
        targetDuration,
        style,
        sceneCount
      };

      const script = await scriptGenerator.generateScript(generationRequest);
      
      // TODO: Save script to database
      const savedScript = await saveScriptToDatabase(script, postId);

      // TODO: Broadcast WebSocket update
      fastify.websocketServer?.clients.forEach((client: any) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'script_generated',
            data: { scriptId: savedScript.id, postId }
          }));
        }
      });

      reply.send({ 
        success: true, 
        script: savedScript 
      });
    } catch (error) {
      fastify.log.error(`Script generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.code(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get script by ID
  fastify.get<{ Params: { id: string } }>('/scripts/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // TODO: Fetch script from database
      const script = await getScriptFromDatabase(id);
      
      if (!script) {
        return reply.code(404).send({ 
          success: false, 
          error: 'Script not found' 
        });
      }

      reply.send({ 
        success: true, 
        script 
      });
    } catch (error) {
      fastify.log.error(`Failed to fetch script: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.code(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Regenerate script with new parameters
  fastify.post<{
    Params: { id: string };
    Body: {
      targetDuration?: number;
      style?: ScriptStyle;
      sceneCount?: number;
    }
  }>('/scripts/:id/regenerate', async (request, reply) => {
    try {
      const { id } = request.params;
      const updateParams = request.body;

      // TODO: Get original script and Reddit post from database
      const originalScript = await getScriptFromDatabase(id);
      const redditPost = await fetchRedditPost(originalScript?.postId);

      if (!originalScript || !redditPost) {
        return reply.code(404).send({ 
          success: false, 
          error: 'Script or original post not found' 
        });
      }

      const originalRequest: ScriptGenerationRequest = {
        redditPost,
        targetDuration: originalScript.generationParams.targetDuration,
        style: originalScript.generationParams.style,
        sceneCount: originalScript.generationParams.sceneCount
      };

      const newScript = await scriptGenerator.regenerateScript(
        originalRequest, 
        updateParams
      );

      // TODO: Save new version to database
      const savedScript = await saveScriptVersion(id, newScript);

      reply.send({ 
        success: true, 
        script: savedScript 
      });
    } catch (error) {
      fastify.log.error(`Script regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.code(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get all versions of a script
  fastify.get<{ Params: { id: string } }>('/scripts/:id/versions', async (request, reply) => {
    try {
      const { id } = request.params;
      
      // TODO: Fetch all script versions from database
      const versions = await getScriptVersions(id);
      
      reply.send({ 
        success: true, 
        versions 
      });
    } catch (error) {
      fastify.log.error(`Failed to fetch script versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.code(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Generate multiple script variations
  fastify.post<{
    Body: {
      postId: string;
      targetDuration?: number;
      variationCount?: number;
    }
  }>('/scripts/variations', async (request, reply) => {
    try {
      const { postId, targetDuration = 60, variationCount = 3 } = request.body;

      const redditPost = await fetchRedditPost(postId);
      
      if (!redditPost) {
        return reply.code(404).send({ 
          success: false, 
          error: 'Reddit post not found' 
        });
      }

      const generationRequest: ScriptGenerationRequest = {
        redditPost,
        targetDuration
      };

      const variations = await scriptGenerator.generateVariations(
        generationRequest, 
        variationCount
      );
      
      // TODO: Save variations to database
      const savedVariations = await Promise.all(
        variations.map(script => saveScriptToDatabase(script, postId))
      );

      reply.send({ 
        success: true, 
        variations: savedVariations 
      });
    } catch (error) {
      fastify.log.error(`Variation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      reply.code(500).send({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  done();
};

// TODO: Implement database functions
async function fetchRedditPost(postId: string): Promise<any> {
  // Mock implementation - replace with actual database query
  return {
    id: postId,
    title: "Sample Reddit Post Title",
    content: "Sample content for testing script generation...",
    author: "testuser",
    subreddit: "motivation",
    score: 150,
    upvotes: 200,
    comments: 25,
    created_at: new Date(),
    url: `https://reddit.com/r/motivation/comments/${postId}`
  };
}

async function saveScriptToDatabase(script: GeneratedScript, postId: string): Promise<any> {
  // Mock implementation - replace with actual database insert
  return {
    id: `script_${Date.now()}`,
    postId,
    ...script,
    created_at: new Date(),
    updated_at: new Date()
  };
}

async function getScriptFromDatabase(id: string): Promise<any> {
  // Mock implementation - replace with actual database query
  return null;
}

async function saveScriptVersion(scriptId: string, script: GeneratedScript): Promise<any> {
  // Mock implementation - replace with actual database versioning
  return {
    id: scriptId,
    ...script,
    version: 2,
    updated_at: new Date()
  };
}

async function getScriptVersions(scriptId: string): Promise<any[]> {
  // Mock implementation - replace with actual database query
  return [];
}

export default scriptsRoutes;