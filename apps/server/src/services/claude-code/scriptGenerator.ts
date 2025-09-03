import Anthropic from '@anthropic-ai/sdk';
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
  private anthropic: Anthropic;

  constructor() {
    this.contentProcessor = new ContentProcessor();

    // Initialize Anthropic client with API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
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
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4096,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract text content from the response
      const textContent = response.content
        .filter(block => block.type === 'text')
        .map(block => (block as { text: string }).text)
        .join('\n');

      return textContent;
    } catch (error) {
      console.error('Claude API error:', error);

      // Handle specific API errors
      if (error instanceof Error && error.message.includes('api_key')) {
        throw new Error(
          'Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY environment variable.'
        );
      }

      if (error instanceof Error && error.message.includes('rate_limit')) {
        throw new Error(
          'Claude API rate limit exceeded. Please try again later.'
        );
      }

      if (error instanceof Error && error.message.includes('invalid_request')) {
        throw new Error(
          'Invalid request to Claude API. Please check the prompt format.'
        );
      }

      throw new Error(
        `Failed to process with Claude API: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
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
