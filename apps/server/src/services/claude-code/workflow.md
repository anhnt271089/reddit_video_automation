# Reddit Video Script Generation - Claude Code Workflow

This workflow processes Reddit posts and generates optimized video scripts using Claude Code's AI capabilities.

## Workflow Overview

**Input**: Reddit post content with metadata
**Output**: Complete video script package with narration, titles, and metadata

## Process

### 1. Content Preprocessing

- Extract Reddit post title and content
- Clean and format text for AI processing
- Identify key themes and emotional tone
- Determine optimal video duration and scene count

### 2. Script Generation (Claude Code Integration Point)

This is where Claude Code processes the content:

**System Prompt**:
You are an expert video script writer specializing in creating engaging, viral-ready content from Reddit stories. Your task is to transform Reddit posts into compelling video narratives that capture attention and drive engagement.

**User Prompt Template**:

```
Generate a complete video script package for the following Reddit post:

**Title**: {title}
**Content**: {content}
**Target Duration**: {duration} seconds
**Target Scenes**: {sceneCount}
**Style**: {style}

Please provide a JSON response with the following structure:
- script: Main narration text
- scenes: Array of scene objects with narration, duration, visualKeywords, and emotion
- metadata: Object containing titles array, description, thumbnailConcepts, and tags

Focus on creating emotionally engaging content that tells a compelling story while maintaining authenticity to the original Reddit post.
```

### 3. Response Processing

- Parse Claude Code's JSON response
- Validate scene structure and metadata
- Calculate total duration
- Format final script package

### 4. Quality Validation

- Ensure script meets duration requirements
- Verify all required fields are present
- Check content quality and coherence

## Expected Output Structure

```json
{
  "script": "Complete narration text...",
  "scenes": [
    {
      "narration": "Scene narration text",
      "duration": 15,
      "visualKeywords": ["keyword1", "keyword2"],
      "emotion": "motivational"
    }
  ],
  "metadata": {
    "titles": ["Title 1", "Title 2", "Title 3"],
    "description": "Video description with SEO optimization",
    "thumbnailConcepts": ["Concept 1", "Concept 2"],
    "tags": ["tag1", "tag2", "tag3"]
  }
}
```

## Integration Notes

This workflow is designed to be executed by Claude Code's AI system. The `processWithClaudeCode` method in the ScriptGenerator class serves as the integration point where Claude Code will process the prompts and return the generated content.
