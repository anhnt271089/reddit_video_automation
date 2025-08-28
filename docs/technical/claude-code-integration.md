# Claude Code Integration for Script Generation

## Overview

This document outlines the approach for using Claude Code subscription for AI-powered script generation instead of external API calls.

## Architecture Benefits

### Why Claude Code Instead of API?

1. **No API Key Management** - Uses your existing Claude Code subscription
2. **No Rate Limits** - Process as many requests as needed locally
3. **Cost Effective** - No per-token charges
4. **Faster Iteration** - Direct feedback loop during development
5. **Better Security** - No external API calls with sensitive data

## Implementation Approach

### 1. Script Generation Service

```typescript
// src/services/claude-code/scriptGenerator.ts
interface ScriptGenerationRequest {
  redditPost: RedditPost;
  targetDuration: number; // in seconds
  style?: 'motivational' | 'educational' | 'entertainment';
}

interface GeneratedScript {
  scriptContent: string;
  sceneBreakdown: SceneData[];
  durationEstimate: number;
  titles: string[]; // 5 variations
  description: string;
  thumbnailConcepts: ThumbnailConcept[];
  keywords: string[];
}

class ClaudeCodeScriptGenerator {
  async generateScript(
    request: ScriptGenerationRequest
  ): Promise<GeneratedScript> {
    // Process Reddit post
    const processedContent = this.preprocessContent(request.redditPost);

    // Generate script using Claude Code
    const script = await this.invokeClaudeCode(processedContent, request);

    // Validate and structure response
    return this.structureResponse(script);
  }

  private async invokeClaudeCode(content: string, options: any): Promise<any> {
    // This will be called by Claude Code directly
    // when processing script generation requests
  }
}
```

### 2. Prompt Templates

```typescript
// src/services/claude-code/prompts.ts
export const SCRIPT_GENERATION_PROMPT = `
You are a professional video script writer specializing in {style} content.

Convert the following Reddit post into a compelling video script:

POST TITLE: {title}
POST CONTENT: {content}
TARGET DURATION: {duration} seconds

Requirements:
1. Create an engaging hook (first 3 seconds)
2. Break content into {sceneCount} distinct scenes
3. Include narration text for each scene
4. Suggest visual keywords for stock footage/images
5. Maintain the original story's essence
6. End with a strong call-to-action

Output Format:
{
  "script": "Complete narration text",
  "scenes": [
    {
      "id": 1,
      "narration": "Scene narration text",
      "duration": 15,
      "visualKeywords": ["keyword1", "keyword2"],
      "emotion": "inspiring"
    }
  ],
  "metadata": {
    "titles": ["Title 1", "Title 2", "Title 3", "Title 4", "Title 5"],
    "description": "YouTube description",
    "thumbnailConcepts": ["Concept 1", "Concept 2"],
    "tags": ["tag1", "tag2"]
  }
}
`;
```

### 3. Content Processing Pipeline

```typescript
// src/services/claude-code/contentProcessor.ts
export class ContentProcessor {
  // Prepare Reddit post for script generation
  preprocessPost(post: RedditPost): ProcessedContent {
    return {
      title: this.sanitizeTitle(post.title),
      content: this.extractMainContent(post),
      metadata: {
        author: post.author,
        subreddit: post.subreddit,
        score: post.score,
        awards: post.awards,
      },
    };
  }

  // Validate generated script
  validateScript(script: GeneratedScript): ValidationResult {
    const checks = [
      this.checkRequiredFields(script),
      this.validateSceneBreakdown(script.sceneBreakdown),
      this.validateDuration(script.durationEstimate),
      this.validateMetadata(script),
    ];

    return {
      isValid: checks.every(c => c.passed),
      errors: checks.filter(c => !c.passed).map(c => c.error),
    };
  }
}
```

### 4. API Endpoints

```typescript
// src/routes/api/scripts.ts
import { ClaudeCodeScriptGenerator } from '@/services/claude-code/scriptGenerator';

const generator = new ClaudeCodeScriptGenerator();

// Generate script from Reddit post
app.post('/api/scripts', async (req, res) => {
  const { postId, targetDuration = 60, style = 'motivational' } = req.body;

  try {
    // Fetch Reddit post from database
    const post = await getRedditPost(postId);

    // Generate script using Claude Code
    const script = await generator.generateScript({
      redditPost: post,
      targetDuration,
      style,
    });

    // Save to database
    const savedScript = await saveScript(script, postId);

    res.json({ success: true, script: savedScript });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 5. Database Schema Updates

```sql
-- Scripts table to store generated content
CREATE TABLE scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reddit_post_id UUID REFERENCES reddit_posts(id),
  version INTEGER DEFAULT 1,
  script_content TEXT NOT NULL,
  scene_breakdown JSONB NOT NULL,
  duration_estimate INTEGER NOT NULL,
  titles TEXT[] NOT NULL,
  description TEXT,
  thumbnail_concepts JSONB,
  keywords TEXT[],
  generation_params JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Script versions for history
CREATE TABLE script_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID REFERENCES scripts(id),
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Workflow Integration

### 1. Content Approval → Script Generation

```mermaid
graph LR
  A[Reddit Post Approved] --> B[Trigger Script Generation]
  B --> C[Claude Code Processing]
  C --> D[Validate Output]
  D --> E[Save to Database]
  E --> F[Notify UI via WebSocket]
```

### 2. Manual Script Generation

- User selects Reddit post from dashboard
- Clicks "Generate Script" button
- Claude Code processes request locally
- Results displayed in real-time

### 3. Script Regeneration

- User can regenerate scripts with different parameters
- Previous versions saved for comparison
- A/B testing different styles/durations

## Development Workflow

### Phase 1: Basic Integration (Day 1-2)

1. Set up script generation service structure
2. Create prompt templates
3. Implement basic Claude Code invocation
4. Test with sample Reddit posts

### Phase 2: API & Storage (Day 3)

1. Create API endpoints
2. Set up database tables
3. Implement versioning system
4. Add error handling

### Phase 3: Integration (Day 6-7)

1. Connect to approval workflow
2. Add WebSocket notifications
3. Implement batch processing
4. Performance optimization

## Testing Strategy

### Unit Tests

```typescript
describe('ClaudeCodeScriptGenerator', () => {
  it('should generate valid script from Reddit post', async () => {
    const post = mockRedditPost();
    const script = await generator.generateScript({
      redditPost: post,
      targetDuration: 60,
    });

    expect(script).toHaveProperty('scriptContent');
    expect(script.sceneBreakdown).toHaveLength(greaterThan(0));
    expect(script.titles).toHaveLength(5);
  });
});
```

### Integration Tests

- Test full pipeline from approval to script generation
- Verify database persistence
- Check WebSocket notifications
- Validate error scenarios

## Advantages Over API Approach

| Aspect      | Claude API         | Claude Code              |
| ----------- | ------------------ | ------------------------ |
| Cost        | Per-token charges  | Included in subscription |
| Rate Limits | 50 req/min         | Unlimited local          |
| Setup       | API key required   | Already configured       |
| Security    | External calls     | Local processing         |
| Development | Slower iteration   | Real-time feedback       |
| Debugging   | Limited visibility | Full control             |

## Next Steps

1. **Immediate Actions:**
   - Create service structure
   - Design prompt templates
   - Set up database schema

2. **Testing Phase:**
   - Process sample Reddit posts
   - Refine prompts based on output
   - Optimize scene breakdown logic

3. **Integration:**
   - Connect to dashboard
   - Add real-time updates
   - Implement batch processing

## Questions for Product Team

1. Preferred script styles (motivational, educational, entertainment)?
2. Target duration ranges (30s, 60s, 90s, 120s)?
3. Number of scene breakdowns per video?
4. Required metadata fields for YouTube?
5. Thumbnail concept generation priority?

---

**Document Status:** Ready for Implementation  
**Last Updated:** Current Session  
**Author:** BMad Orchestrator
