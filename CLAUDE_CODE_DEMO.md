# Claude Code Script Generation Demo

This file demonstrates how Claude Code will integrate with the script generation service.

## How It Works

When the `ClaudeCodeScriptGenerator.processWithClaudeCode()` method is called, Claude Code will:

1. Receive a structured prompt
2. Process it using the Claude model
3. Return a JSON response with the generated script

## Example Integration

Here's what happens when you call the script generation API:

### Input (Reddit Post)

```json
{
  "title": "Amazing Success Story: From Zero to Hero",
  "content": "I was broke and homeless two years ago. Today I bought my first house and started my own business. Here's how I did it step by step...",
  "targetDuration": 60,
  "style": "motivational"
}
```

### Prompt Sent to Claude Code

```
You are a professional motivational video script writer who creates inspiring, uplifting content that motivates viewers to take action.

Your expertise includes:
- Creating powerful hooks that grab attention in the first 3 seconds
- Structuring content for maximum viewer retention
- Breaking stories into visual scenes with clear narration
- Generating YouTube-optimized titles and descriptions
- Suggesting relevant visual elements and keywords

Always output valid JSON format and ensure all required fields are present.

Convert this Reddit post into a compelling 60-second video script:

**POST TITLE:** Amazing Success Story: From Zero to Hero
**POST CONTENT:** I was broke and homeless two years ago. Today I bought my first house and started my own business. Here's how I did it step by step...
**TARGET DURATION:** 60 seconds
**STYLE:** motivational
**SCENES NEEDED:** 4

Requirements:
1. Create an attention-grabbing hook (first 3-5 seconds)
2. Break the content into exactly 4 distinct scenes
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
- All durations sum to 60 seconds
- Each scene has meaningful visual keywords
- Titles are click-worthy but not clickbait
- Description is 150-300 words with relevant hashtags
- All JSON is properly formatted and valid
```

### Expected Claude Code Response

```json
{
  "script": "Two years ago, this person had nothing. No home, no money, no hope. But today? They're a homeowner and business owner. Here's exactly how they turned their life around in 24 months. It started with one simple decision that changed everything. They stopped making excuses and started taking action. Every single day, they worked toward their goal, even when it seemed impossible. The breakthrough came when they realized success isn't about luck – it's about persistence, smart choices, and never giving up on yourself. If they can do it starting from zero, so can you.",
  "scenes": [
    {
      "id": 1,
      "narration": "Two years ago, this person had nothing. No home, no money, no hope.",
      "duration": 10,
      "visualKeywords": [
        "homeless person",
        "empty wallet",
        "dark street",
        "despair",
        "rock bottom"
      ],
      "emotion": "dramatic"
    },
    {
      "id": 2,
      "narration": "But today? They're a homeowner and business owner. Here's exactly how they turned their life around in 24 months.",
      "duration": 15,
      "visualKeywords": [
        "house keys",
        "business office",
        "transformation",
        "success",
        "achievement"
      ],
      "emotion": "inspiring"
    },
    {
      "id": 3,
      "narration": "It started with one simple decision that changed everything. They stopped making excuses and started taking action. Every single day, they worked toward their goal, even when it seemed impossible.",
      "duration": 20,
      "visualKeywords": [
        "determination",
        "hard work",
        "computer",
        "planning",
        "daily routine"
      ],
      "emotion": "motivational"
    },
    {
      "id": 4,
      "narration": "The breakthrough came when they realized success isn't about luck – it's about persistence, smart choices, and never giving up on yourself. If they can do it starting from zero, so can you.",
      "duration": 15,
      "visualKeywords": [
        "lightbulb moment",
        "celebration",
        "growth",
        "motivation",
        "you can do it"
      ],
      "emotion": "inspiring"
    }
  ],
  "metadata": {
    "titles": [
      "From Homeless to Homeowner in 2 Years (Here's How)",
      "Zero to Hero: The Ultimate Success Transformation",
      "How I Went from Broke to Business Owner in 24 Months",
      "From Rock Bottom to the Top: My Journey to Success",
      "This Person Changed Their Life in 2 Years (You Can Too)"
    ],
    "description": "This incredible transformation story proves that no matter how low you fall, you can always rise again. Watch as we break down the exact steps this person took to go from homeless and broke to owning a house and running their own business in just 24 months. The strategies they used are simple but powerful, and anyone can apply them to their own life. Whether you're struggling financially, looking to start a business, or just need motivation to keep going, this story will inspire you to take action today. Remember: success isn't about where you start, it's about refusing to give up. #SuccessStory #Motivation #Transformation #BusinessOwner #NeverGiveUp #FromZeroToHero #Inspiration #LifeChange #Entrepreneur #Mindset",
    "thumbnailConcepts": [
      {
        "description": "Split screen showing homeless person on left, successful person with house keys on right",
        "visualElements": [
          "before/after split",
          "house keys",
          "contrast lighting"
        ],
        "textOverlay": "2 YEARS LATER",
        "colorScheme": "dramatic contrast with bright hope"
      }
    ],
    "tags": [
      "success",
      "motivation",
      "transformation",
      "business",
      "inspiration"
    ]
  }
}
```

## Testing the Integration

To test this with Claude Code:

1. **Run the Script Generation API:**

   ```bash
   POST http://localhost:3000/api/scripts
   {
     "postId": "sample_post",
     "targetDuration": 60,
     "style": "motivational"
   }
   ```

2. **Claude Code Processing:**
   - The service will call `processWithClaudeCode()` with the structured prompt
   - Claude Code will process the prompt and return the JSON response
   - The service will parse and validate the response
   - The final script will be returned to the API caller

3. **Result:**
   - Complete video script with scenes
   - 5 YouTube title variations
   - SEO-optimized description
   - Thumbnail concepts
   - Visual keywords for each scene

## Benefits of Claude Code Integration

- **No API Keys:** Uses your existing Claude Code subscription
- **Real-time Processing:** Immediate feedback during development
- **Cost Effective:** No per-token charges
- **Full Control:** Complete visibility into the generation process
- **Easy Testing:** Test prompts and refine outputs instantly

## Next Steps

1. Test the API endpoint with sample Reddit posts
2. Refine prompts based on output quality
3. Add the dashboard UI to trigger script generation
4. Connect to the approval workflow
5. Add WebSocket notifications for real-time updates
