import { PromptTemplates } from './prompts';
import { ContentProcessor } from './contentProcessor';
import {
  ScriptGenerationRequest,
  GeneratedScript,
  ScriptStyle,
  ClaudeCodeResponse,
  ValidationResult
} from './types';

export class ClaudeCodeScriptGenerator {
  private contentProcessor: ContentProcessor;

  constructor() {
    this.contentProcessor = new ContentProcessor();
  }

  async generateScript(request: ScriptGenerationRequest): Promise<GeneratedScript> {
    try {
      // Process and validate the Reddit post content
      const processedContent = this.contentProcessor.preprocessPost(request.redditPost);
      
      // Determine optimal parameters
      const style = request.style || 'motivational';
      const targetDuration = request.targetDuration || 60;
      const sceneCount = request.sceneCount || this.calculateOptimalScenes(targetDuration);

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
        sceneCount
      });

      // Validate the generated script
      const validation = this.contentProcessor.validateScript(script);
      if (!validation.isValid) {
        throw new Error(`Script validation failed: ${validation.errors.join(', ')}`);
      }

      return script;
    } catch (error) {
      console.error('Script generation failed:', error);
      throw new Error(`Failed to generate script: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Here's where Claude Code would be invoked
    // This is a placeholder that will be replaced with actual Claude Code integration
    const claudePrompt = `${systemPrompt}\n\n${userPrompt}`;
    
    // TODO: Replace this with actual Claude Code invocation
    // For now, we'll create a structured response format that Claude Code can fill
    const response = await this.processWithClaudeCode(claudePrompt);
    
    return this.parseClaudeResponse(response);
  }

  private async processWithClaudeCode(prompt: string): Promise<string> {
    // This method will be called by Claude Code during execution
    // The actual implementation will be handled by Claude Code's processing
    
    // Placeholder for Claude Code integration point
    // When this service is called, Claude Code will:
    // 1. Receive the structured prompt
    // 2. Process it using the Claude model
    // 3. Return the JSON response
    
    return `This will be processed by Claude Code with the following prompt:\n\n${prompt}`;
  }

  private parseClaudeResponse(response: string): ClaudeCodeResponse {
    try {
      // Extract JSON from Claude's response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      // Validate required structure
      if (!parsedResponse.script || !parsedResponse.scenes || !parsedResponse.metadata) {
        throw new Error('Invalid response structure from Claude');
      }

      return parsedResponse;
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      throw new Error('Invalid JSON response from Claude Code');
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
        emotion: scene.emotion || 'motivational'
      })),
      durationEstimate: claudeResponse.scenes.reduce((total, scene) => total + scene.duration, 0),
      titles: claudeResponse.metadata.titles,
      description: claudeResponse.metadata.description,
      thumbnailConcepts: claudeResponse.metadata.thumbnailConcepts || [],
      keywords: claudeResponse.metadata.tags || [],
      generationParams: params
    };
  }

  private calculateOptimalScenes(duration: number): number {
    // Calculate optimal number of scenes based on duration
    if (duration <= 30) return 3;
    if (duration <= 60) return 4;
    if (duration <= 90) return 5;
    if (duration <= 120) return 6;
    return Math.ceil(duration / 20); // ~20 seconds per scene for longer videos
  }

  // Regenerate script with different parameters
  async regenerateScript(
    originalRequest: ScriptGenerationRequest,
    newParams: Partial<ScriptGenerationRequest>
  ): Promise<GeneratedScript> {
    const updatedRequest = {
      ...originalRequest,
      ...newParams
    };
    
    return this.generateScript(updatedRequest);
  }

  // Generate multiple variations for A/B testing
  async generateVariations(
    request: ScriptGenerationRequest,
    count: number = 3
  ): Promise<GeneratedScript[]> {
    const variations: GeneratedScript[] = [];
    
    const styles: ScriptStyle[] = ['motivational', 'educational', 'entertainment', 'storytelling'];
    
    for (let i = 0; i < count; i++) {
      const variationRequest = {
        ...request,
        style: styles[i % styles.length]
      };
      
      const script = await this.generateScript(variationRequest);
      variations.push(script);
    }
    
    return variations;
  }
}