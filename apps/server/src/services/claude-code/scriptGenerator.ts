import { PromptTemplates } from './prompts';
import { ContentProcessor } from './contentProcessor';
import {
  ScriptGenerationRequest,
  GeneratedScript,
  ScriptStyle,
  ClaudeCodeResponse,
  ValidationResult,
} from './types';

export class ClaudeCodeScriptGenerator {
  private contentProcessor: ContentProcessor;

  constructor() {
    this.contentProcessor = new ContentProcessor();
  }

  async generateScript(
    request: ScriptGenerationRequest
  ): Promise<GeneratedScript> {
    try {
      // Process and validate the Reddit post content
      const processedContent = this.contentProcessor.preprocessPost(
        request.redditPost
      );

      // Determine optimal parameters
      const style = request.style || 'motivational';
      const targetDuration = request.targetDuration || 60;
      const sceneCount =
        request.sceneCount || this.calculateOptimalScenes(targetDuration);

      // Generate the script using Claude Code
      const claudeResponse = await this.invokeClaudeCode(
        processedContent.title,
        processedContent.content,
        targetDuration,
        sceneCount,
        style
      );

      // Structure and validate the response
      const script = this.structureResponse(claudeResponse, {
        style,
        targetDuration,
        sceneCount,
      });

      // Validate the generated script
      const validation = this.contentProcessor.validateScript(script);
      if (!validation.isValid) {
        throw new Error(
          `Script validation failed: ${validation.errors.join(', ')}`
        );
      }

      return script;
    } catch (error) {
      console.error('Script generation failed:', error);
      throw new Error(
        `Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async invokeClaudeCode(
    title: string,
    content: string,
    targetDuration: number,
    sceneCount: number,
    style: ScriptStyle
  ): Promise<ClaudeCodeResponse> {
    // Get the system and user prompts
    const systemPrompt = PromptTemplates.getSystemPrompt(style);
    const userPrompt = PromptTemplates.getScriptGenerationPrompt(
      title,
      content,
      targetDuration,
      sceneCount,
      style
    );

    // Call Claude API with proper system and user message structure
    const response = await this.processWithClaudeCode(systemPrompt, userPrompt);

    return this.parseClaudeResponse(response);
  }

  private async processWithClaudeCode(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    // Claude Code Integration Point
    // This method will be invoked by Claude Code when the script generation workflow is triggered
    // The systemPrompt and userPrompt will be processed by Claude Code's AI system

    const fullPrompt = `${systemPrompt}\n\nUser Request:\n${userPrompt}`;

    // Simulate Claude Code processing for now - this will be replaced by actual Claude Code execution
    // In production, this method will be called by the Claude Code system
    console.log('Processing with Claude Code integration...');
    console.log('System Prompt:', systemPrompt);
    console.log('User Prompt:', userPrompt);

    // Return mock response for now - Claude Code will provide actual response
    return this.getMockClaudeCodeResponse();
  }

  private getMockClaudeCodeResponse(): string {
    return JSON.stringify({
      script:
        "Welcome to today's motivational video! Let me share an incredible story from Reddit that shows the power of perseverance. This story will inspire you to never give up on your dreams and push through any obstacle.",
      scenes: [
        {
          narration:
            'Picture this: A young person facing their biggest challenge yet.',
          duration: 15,
          visualKeywords: [
            'challenge',
            'determination',
            'young person',
            'obstacle',
          ],
          emotion: 'motivational',
        },
        {
          narration:
            'They could have given up, but instead they chose to fight.',
          duration: 15,
          visualKeywords: ['fight', 'courage', 'never give up', 'strength'],
          emotion: 'motivational',
        },
        {
          narration:
            'And that choice changed everything. Their persistence paid off.',
          duration: 15,
          visualKeywords: ['success', 'achievement', 'persistence', 'victory'],
          emotion: 'motivational',
        },
        {
          narration:
            'This proves that with the right mindset, anything is possible.',
          duration: 15,
          visualKeywords: ['mindset', 'possibility', 'growth', 'inspiration'],
          emotion: 'motivational',
        },
      ],
      metadata: {
        titles: [
          'This Reddit Story Will Change Your Perspective Forever',
          'The Power of Never Giving Up - Incredible Story',
          "Why This Person's Journey Proves Anything is Possible",
          'Amazing Transformation: From Fear to Confidence',
          'How One Decision Changed Everything - Inspirational Story',
        ],
        description:
          "An inspiring story from Reddit that demonstrates the incredible power of perseverance and determination in overcoming life's challenges.",
        thumbnailConcepts: [
          'Person climbing mountain with sunrise in background',
          'Before and after transformation split screen',
          'Motivational quote overlay on success imagery',
        ],
        tags: [
          'motivation',
          'inspiration',
          'never give up',
          'success story',
          'perseverance',
        ],
      },
    });
  }

  private parseClaudeResponse(response: string): ClaudeCodeResponse {
    try {
      // Try to extract JSON from Claude's response
      // First, try to find JSON wrapped in code blocks
      const codeBlockMatch = response.match(
        /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
      );
      let jsonStr = '';

      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1];
      } else {
        // If no code block, try to find JSON in the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in Claude response');
        }
        jsonStr = jsonMatch[0];
      }

      const parsedResponse = JSON.parse(jsonStr);

      // Validate required structure
      if (
        !parsedResponse.script ||
        !parsedResponse.scenes ||
        !parsedResponse.metadata
      ) {
        throw new Error(
          'Invalid response structure from Claude. Missing required fields: script, scenes, or metadata'
        );
      }

      // Validate scenes structure
      if (
        !Array.isArray(parsedResponse.scenes) ||
        parsedResponse.scenes.length === 0
      ) {
        throw new Error('Invalid scenes structure. Expected non-empty array.');
      }

      // Validate each scene has required fields
      parsedResponse.scenes.forEach((scene: any, index: number) => {
        if (!scene.narration || !scene.duration || !scene.visualKeywords) {
          throw new Error(
            `Scene ${index + 1} is missing required fields: narration, duration, or visualKeywords`
          );
        }
      });

      // Validate metadata structure
      if (
        !parsedResponse.metadata.titles ||
        !Array.isArray(parsedResponse.metadata.titles)
      ) {
        throw new Error('Invalid metadata structure. titles must be an array.');
      }

      return parsedResponse;
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      console.error('Raw response:', response);

      if (error instanceof SyntaxError) {
        throw new Error(
          'Invalid JSON format in Claude response. The response may be malformed.'
        );
      }

      throw new Error(
        `Failed to parse Claude response: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
      );
    }
  }

  private structureResponse(
    claudeResponse: ClaudeCodeResponse,
    params: { style: ScriptStyle; targetDuration: number; sceneCount: number }
  ): GeneratedScript {
    return {
      scriptContent: claudeResponse.script,
      sceneBreakdown: claudeResponse.scenes.map(scene => ({
        ...scene,
        emotion: scene.emotion || 'motivational',
      })),
      durationEstimate: claudeResponse.scenes.reduce(
        (total, scene) => total + scene.duration,
        0
      ),
      titles: claudeResponse.metadata.titles,
      description: claudeResponse.metadata.description,
      thumbnailConcepts: claudeResponse.metadata.thumbnailConcepts || [],
      keywords: claudeResponse.metadata.tags || [],
      generationParams: params,
    };
  }

  private calculateOptimalScenes(duration: number): number {
    // Calculate optimal number of scenes based on duration
    if (duration <= 30) {
      return 3;
    }
    if (duration <= 60) {
      return 4;
    }
    if (duration <= 90) {
      return 5;
    }
    if (duration <= 120) {
      return 6;
    }
    return Math.ceil(duration / 20); // ~20 seconds per scene for longer videos
  }

  // Regenerate script with different parameters
  async regenerateScript(
    originalRequest: ScriptGenerationRequest,
    newParams: Partial<ScriptGenerationRequest>
  ): Promise<GeneratedScript> {
    const updatedRequest = {
      ...originalRequest,
      ...newParams,
    };

    return this.generateScript(updatedRequest);
  }

  // Generate multiple variations for A/B testing
  async generateVariations(
    request: ScriptGenerationRequest,
    count: number = 3
  ): Promise<GeneratedScript[]> {
    const variations: GeneratedScript[] = [];

    const styles: ScriptStyle[] = [
      'motivational',
      'educational',
      'entertainment',
      'storytelling',
    ];

    for (let i = 0; i < count; i++) {
      const variationRequest = {
        ...request,
        style: styles[i % styles.length],
      };

      const script = await this.generateScript(variationRequest);
      variations.push(script);
    }

    return variations;
  }
}
