import { ScriptStyle } from './types';

export class PromptTemplates {
  static getSystemPrompt(style: ScriptStyle): string {
    const stylePrompts = {
      motivational: "You are a professional motivational video script writer who creates inspiring, uplifting content that motivates viewers to take action.",
      educational: "You are an educational content creator who breaks down complex topics into engaging, easy-to-understand video scripts.",
      entertainment: "You are an entertainment writer who creates engaging, fun, and captivating video content that keeps viewers hooked.",
      storytelling: "You are a master storyteller who transforms any content into compelling narrative-driven video scripts."
    };

    return `${stylePrompts[style]}

Your expertise includes:
- Creating powerful hooks that grab attention in the first 3 seconds
- Structuring content for maximum viewer retention
- Breaking stories into visual scenes with clear narration
- Generating YouTube-optimized titles and descriptions
- Suggesting relevant visual elements and keywords

Always output valid JSON format and ensure all required fields are present.`;
  }

  static getScriptGenerationPrompt(
    title: string,
    content: string,
    targetDuration: number,
    sceneCount: number,
    style: ScriptStyle
  ): string {
    return `Convert this Reddit post into a compelling ${targetDuration}-second video script:

**POST TITLE:** ${title}
**POST CONTENT:** ${content}
**TARGET DURATION:** ${targetDuration} seconds
**STYLE:** ${style}
**SCENES NEEDED:** ${sceneCount}

Requirements:
1. Create an attention-grabbing hook (first 3-5 seconds)
2. Break the content into exactly ${sceneCount} distinct scenes
3. Each scene should have clear narration text
4. Include 3-5 visual keywords per scene for stock footage/images
5. Maintain the original story's emotional impact and key messages
6. End with a strong call-to-action or memorable conclusion
7. Ensure total estimated duration matches target

**Output this exact JSON structure:**
{
  "script": "Complete narration text as one flowing script",
  "scenes": [
    {
      "id": 1,
      "narration": "Scene-specific narration text",
      "duration": 15,
      "visualKeywords": ["keyword1", "keyword2", "keyword3"],
      "emotion": "inspiring"
    }
  ],
  "metadata": {
    "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
    "description": "SEO-optimized YouTube description with hashtags",
    "thumbnailConcepts": [
      {
        "description": "Thumbnail concept description",
        "visualElements": ["element1", "element2"],
        "textOverlay": "SHOCKING TRUTH",
        "colorScheme": "bright and energetic"
      }
    ],
    "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
  }
}

Ensure:
- All durations sum to ${targetDuration} seconds
- Each scene has meaningful visual keywords
- Titles are click-worthy but not clickbait
- Description is 150-300 words with relevant hashtags
- All JSON is properly formatted and valid`;
  }

  static getContentOptimizationPrompt(content: string): string {
    return `Analyze this Reddit post content and optimize it for video script generation:

**CONTENT:** ${content}

Tasks:
1. Extract the main story/message
2. Identify key emotional moments
3. Remove unnecessary details that won't work in video format
4. Highlight visual elements that can be shown
5. Note any potential content issues (profanity, sensitive topics, etc.)

Return a JSON object with:
{
  "optimizedContent": "Cleaned and optimized version of the content",
  "keyMoments": ["moment1", "moment2", "moment3"],
  "visualElements": ["element1", "element2"],
  "contentFlags": ["flag1", "flag2"] // if any concerns
  "recommendedDuration": 60 // suggested duration in seconds
}`;
  }
}