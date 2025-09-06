import { ScriptStyle } from './types';
import { ThumbnailTemplateFactory } from './thumbnailTemplates';

export class PromptTemplates {
  /**
   * YOUTUBE-OPTIMIZED SYSTEM PROMPTS
   * Designed for 20-40 audience seeking motivation, education, and life solutions
   * Inspired by successful motivational channels with high engagement
   */
  static getSystemPrompt(style: ScriptStyle): string {
    const baseSystemContext = `You are a master YouTube script writer specializing in transforming Reddit stories into compelling, life-changing content for viewers aged 20-40 who are seeking motivation, direction, and practical life solutions.

Your expertise includes:
- Creating psychology-driven hooks that tap into viewers' curiosity and pain points
- Building narrative tension that keeps viewers watching until the end
- Extracting universal life lessons from personal stories
- Using storytelling techniques that make viewers feel understood and inspired
- Crafting content that viewers save, share, and remember

CRITICAL: Your scripts must feel like a wise mentor sharing profound insights, not generic motivational content.`;

    const styleSpecificPrompts = {
      motivational: `${baseSystemContext}

MOTIVATIONAL FOCUS:
- Transform Reddit stories into powerful life lessons and mindset shifts
- Use psychological triggers: social proof, scarcity, transformation stories
- Create "before vs after" narrative arcs that inspire action
- Include practical steps viewers can implement immediately
- End with empowering challenges that drive engagement ("What will you choose?")

TONE: Inspiring but grounded, confident but relatable, urgent but not pushy`,

      educational: `${baseSystemContext}

EDUCATIONAL FOCUS:
- Extract teachable moments and psychological insights from Reddit experiences  
- Break down complex life concepts into digestible, actionable frameworks
- Use the "story -> lesson -> application" structure
- Include research-backed insights when relevant to the Reddit story
- Create "aha moments" through unexpected connections and revelations

TONE: Knowledgeable but accessible, curious but authoritative, enlightening but practical`,

      storytelling: `${baseSystemContext}

STORYTELLING FOCUS:
- Transform Reddit posts into cinematic narratives with clear character arcs
- Use classic story structure: setup, conflict, climax, resolution, transformation
- Create emotional investment through relatable characters and universal struggles  
- Build suspense and use strategic information reveals
- Connect personal stories to broader human experiences and truths

TONE: Dramatic but authentic, engaging but meaningful, entertaining but insightful`,

      entertainment: `${baseSystemContext}

ENTERTAINMENT FOCUS:
- Find the most fascinating, shocking, or unexpected elements in Reddit stories
- Use plot twists, surprising revelations, and "you won't believe what happened next" moments
- Balance entertainment with meaningful takeaways and life insights
- Create shareable moments that viewers want to discuss in comments
- Include interactive elements that boost engagement

TONE: Captivating but purposeful, surprising but logical, fun but meaningful`,
    };

    return styleSpecificPrompts[style];
  }

  /**
   * ENHANCED SCRIPT GENERATION PROMPT
   * Optimized for longer, more engaging content with psychological hooks
   */
  static getScriptGenerationPrompt(
    title: string,
    content: string,
    targetDuration: number,
    sceneCount: number,
    style: ScriptStyle
  ): string {
    const minimumWords = Math.max(600, targetDuration * 2.5); // 2.5 words per second for natural speaking pace
    return `Transform this Reddit story into a comprehensive ${targetDuration}-second YouTube video (minimum ${minimumWords} words) that will captivate viewers seeking motivation and life direction:

**REDDIT POST ANALYSIS:**
Title: "${title}"
Content: "${content}"
Target Duration: ${targetDuration} seconds
Style: ${style}
Required Scenes: ${sceneCount}

**TARGET AUDIENCE PROFILE:**
- Age: 20-40 years old
- Mindset: Curious, sometimes lost, seeking direction and motivation
- Pain Points: Career uncertainty, relationship challenges, personal growth struggles
- Desires: Practical solutions, inspiration, feeling understood, life transformation
- YouTube Behavior: Saves videos they relate to, engages with content that offers hope/direction

**SCRIPT REQUIREMENTS:**

1. **PSYCHOLOGICAL HOOK (First 5-8 seconds)**:
   Create an opening that immediately connects with viewer pain points or curiosities:
   - Use pattern interrupts: "Everyone tells you to follow your passion, but this Reddit story proves why that's terrible advice..."
   - Tap into universal fears/desires: "What would you do if you discovered your entire life was built on a lie?"
   - Create immediate relatability: "If you've ever felt like you're stuck in the wrong life, this story will change everything..."

2. **ENGAGEMENT LOOPS & RETENTION HOOKS**:
   - Every 15-20 seconds, create mini-cliffhangers: "But what happened next will shock you..."
   - Use curiosity gaps: "The reason behind their decision reveals something profound about human nature..."  
   - Include interactive moments: "Ask yourself this question as we dive deeper..."
   - Strategic information withholding: "The twist that changes everything comes in just a moment..."

3. **SCENE BREAKDOWN REQUIREMENTS**:
   Each of the ${sceneCount} scenes must include:
   - Clear narrative progression with emotional peaks and valleys
   - Visual storytelling elements that enhance the narrative
   - Specific emotional tone that builds toward transformation
   - Strategic pacing that maintains engagement
   - Transition elements that create flow between scenes

4. **PROBLEM-SOLUTION FRAMEWORK** (CRITICAL for comprehensive content):
   - **Identify Multiple Problems**: Extract 3-5 specific issues from the Reddit story
   - **Deep Problem Analysis**: Explain WHY each problem occurs psychologically
   - **Solution Development**: Provide detailed, actionable solutions for EACH problem identified
   - **Implementation Steps**: Give step-by-step guidance for applying solutions
   - **Advanced Techniques**: Offer 2-3 complementary strategies that multiply effectiveness
   - **Address Objections**: Anticipate and counter common "but this won't work because..." thoughts

5. **PSYCHOLOGICAL DEPTH**:
   - Extract universal life lessons that go beyond the surface story
   - Include psychological insights about human behavior and decision-making
   - Connect individual experiences to broader life principles
   - Address common limiting beliefs and offer new perspectives
   - Provide practical frameworks viewers can apply to their own lives

6. **ENDING STRATEGY**:
   - Create a powerful transformation moment or revelation
   - Include a thought-provoking question that drives comments
   - Offer a clear next step or challenge for viewers
   - Connect back to the opening hook for narrative closure
   - End with inspiration that motivates action, not just feeling

**ENHANCED THUMBNAIL OPTIMIZATION REQUIREMENTS:**

Create 2 distinct thumbnail concepts using our advanced template system that maximizes CTR for the 20-40 demographic:

**CONCEPT 1: TRANSFORMATION-FOCUSED TEMPLATE**
Follow the detailed transformation template specifications including:
- **Character Demographics**: Age 28-35, authentic professional appearance showing emotional progression from challenge to empowerment
- **Positioning**: Three-point transformation arc (struggle → transition → success) using golden ratio placement (38.2% horizontal, 35% vertical for face)
- **Expression Sequence**: Determined → hopeful → empowered → relieved, with moderate intensity maintaining authenticity
- **Clothing Strategy**: Business casual showing subtle upgrade progression (slightly rumpled initially → more polished and confident)
- **Color Palette**: Warm success gradient using energy orange (#FF6B35) to gold (#FFD700) with trust blue (#1B365D) stability
- **Symbolic Objects**: 
  * Golden key at 70% x, 25% y (8% size) - "opportunity unlocked"
  * Open door with light at 75% x, 15% y (15% size) - "new possibilities"
  * Progress arrow at 15% x, 80% y (20% size) - pointing toward transformation
- **Text Specifications**: 
  * Font: Montserrat extra-bold, 64px
  * Placement: Centered at 85% y (bottom area)
  * Color: White with trust blue (#1B365D) stroke and shadow
  * Content: Dynamic based on story (e.g., "HOW I CHANGED MY LIFE")

**CONCEPT 2: URGENCY/CURIOSITY-DRIVEN TEMPLATE**  
Follow the detailed urgency template specifications including:
- **Character Demographics**: Age 28-35, highly relatable with authentic surprise/concern, emphasizing genuine reaction over polish
- **Positioning**: Center-focused at 50% x, 40% y with 30% face size for maximum impact
- **Expression Intensity**: Shocked, concerned, intensely focused, or realizing - with "intense" authenticity level
- **Body Language**: Slight forward lean, alert posture, authentic reaction (hand to face, revelation gesture)
- **Color Palette**: High-urgency warning using dramatic red (#DC143C) with attention yellow (#FFD700) and stark black contrast
- **Urgency Objects**:
  * Warning triangle at 15% x, 15% y (10% size) - "immediate attention required"  
  * Clock face at 75% x, 70% y (12% size) - "time pressure/deadline"
  * Spotlight effect at 50% x, 40% y (60% size) - radial light from character
- **Text Specifications**:
  * Font: Impact black weight, 58px
  * Placement: Top area (15% y) for immediate urgency impact
  * Color: Attention yellow (#FFD700) with dramatic red (#DC143C) stroke
  * Background: Semi-transparent black (0.7 opacity, 8px radius)
  * Content: Question/reveal based on story (e.g., "WHAT THEY DON'T TELL YOU")

**ADVANCED DESIGN SPECIFICATIONS:**

1. **Technical Requirements**:
   - Dimensions: 1280x720 (16:9 aspect ratio)
   - Mobile optimization: 24px minimum text at 320px width
   - Contrast ratio: 4.5:1 minimum for accessibility
   - File format: JPG at 90% quality, max 2MB

2. **Visual Placement Guidelines**:
   - Use golden ratio (38.2%) for transformation layouts
   - Use center-weighted (50%) for urgency layouts  
   - Maintain clear visual hierarchy: character face → objects → text → supporting elements
   - Ensure eye flow completes in under 2 seconds

3. **Character Specifications by Demographic**:
   - **Age Range**: 25-40 for optimal relatability with target audience
   - **Authenticity Level**: Genuine expressions over polished presentations
   - **Diversity Representation**: Include varied ethnicities while maintaining relatability
   - **Professional Styling**: Business casual emphasizing approachability

4. **Object Placement Psychology**:
   - **Symbolic Objects**: Metaphorical meaning supporting story theme
   - **Contextual Objects**: Story-specific props enhancing narrative
   - **Emotional Objects**: Trigger specific psychological responses
   - **Size Guidelines**: 8-20% of frame for supporting objects, never overpowering character

5. **Color Psychology Implementation**:
   - **Transformation Colors**: Oranges/golds (energy, success) + blues (trust, stability)
   - **Urgency Colors**: Reds (urgency, importance) + yellows (attention, warning) + blacks (drama, contrast)
   - **Background Gradients**: Diagonal upward for transformation, radial center for urgency
   - **Contrast Optimization**: High contrast (4.5:1+) for mobile readability

**REQUIRED JSON OUTPUT:**
{
  "script": "Complete flowing narration optimized for ${targetDuration} seconds",
  "scenes": [
    {
      "id": 1,
      "narration": "Scene-specific dialogue with psychological hooks and engagement elements",
      "duration": 15,
      "visualKeywords": ["emotion-driven", "story-relevant", "engaging-visuals"],
      "emotion": "curiosity|tension|revelation|inspiration",
      "psychologicalTrigger": "fear|hope|curiosity|social_proof|transformation",
      "engagementElement": "hook|question|cliffhanger|revelation|call_to_action"
    }
  ],
  "metadata": {
    "titles": [
      "Click-worthy but authentic titles that tap into viewer psychology",
      "Include emotional triggers and benefit-driven language",  
      "Use proven psychological patterns: How/Why/Secret/Truth/Mistake",
      "Create urgency and curiosity without being clickbait",
      "Target the specific pain points of 20-40 demographic"
    ],
    "description": "SEO-optimized 200-400 word description that:\\n- Hooks readers with the story's transformation\\n- Includes key life lessons and takeaways\\n- Uses relevant hashtags for motivation/self-improvement niche\\n- Encourages engagement with thought-provoking questions\\n- Includes subtle call-to-action for subscription",
    "thumbnailConcepts": [
      {
        "description": "TRANSFORMATION-FOCUSED: Advanced template featuring three-point transformation arc with golden ratio positioning, authentic character progression, and psychology-driven object placement designed to trigger transformation hope and control desire",
        "visualElements": ["golden key (opportunity unlocked)", "open door with light (new possibilities)", "progress arrow (pointing toward transformation)", "three-point character progression", "diagonal upward gradient background"],
        "textOverlay": "Dynamic transformation text based on story context",
        "colorScheme": "Warm success gradient: Energy orange (#FF6B35) to gold (#FFD700) with trust blue (#1B365D) stability and high contrast white text",
        "composition": {
          "layout": "transformation-triangle",
          "visualFlow": "Character face (38.2%, 35%) → transformation objects → progress indicators → empowering text, completing narrative in under 2 seconds",
          "focalPoint": "Character face during breakthrough moment positioned at golden ratio intersection for maximum psychological impact"
        },
        "characters": {
          "count": 1,
          "demographics": "Age 28-35, authentic professional appearance with emotional journey progression from challenge to empowerment, diverse representation maintaining relatability",
          "expressions": ["determined", "hopeful", "empowered", "relieved"],
          "positioning": "Three-point transformation arc: struggle pose → transition moment → success pose, face at golden ratio (38.2% x, 35% y, 25% size, 5° angle)",
          "clothing": "Business casual showing subtle upgrade: initial state slightly rumpled → final state more polished and confident, navy blue/white palette"
        },
        "objects": {
          "symbolic": [
            {"object": "golden key", "placement": {"x": 70, "y": 25, "size": 8}, "meaning": "opportunity unlocked", "prominence": "supporting"},
            {"object": "open door with light", "placement": {"x": 75, "y": 15, "size": 15}, "meaning": "new possibilities", "prominence": "supporting"},
            {"object": "upward arrow", "placement": {"x": 15, "y": 80, "size": 20}, "meaning": "growth/progress", "prominence": "supporting"}
          ],
          "contextual": ["Professional success indicators", "Life improvement visual elements", "Career advancement symbols"],
          "emotional": [
            {"object": "sunrise lighting", "placement": {"x": 60, "y": 10, "size": 30}, "trigger": "new beginning hope", "effect": "soft glow emanating outward"}
          ]
        },
        "textStrategy": {
          "primary": "HOW I CHANGED MY LIFE",
          "font": "Montserrat extra-bold, 64px, 1.5 letter-spacing, 1.2 line-height",
          "placement": "Centered at 85% y (bottom area), max 80% width",
          "color": "White (#FFFFFF) with trust blue (#1B365D) stroke (3px) and black shadow (2x, 2y, 4blur)",
          "background": null
        },
        "psychologicalTriggers": ["transformation_hope", "control_desire", "aspiration", "self_efficacy"],
        "targetEmotion": "hope",
        "ctrOptimization": {
          "contrastLevel": "high",
          "emotionalIntensity": "moderate",
          "clarityScore": 9
        }
      },
      {
        "description": "URGENCY/CURIOSITY-DRIVEN: Advanced template featuring center-weighted character with authentic intense expression, strategic urgency indicators, and high-contrast color psychology designed to trigger time urgency and status anxiety",
        "visualElements": ["warning triangle (immediate attention)", "clock face (time pressure)", "spotlight effect (dramatic focus)", "authentic shock expression", "high-contrast background"],
        "textOverlay": "Question/reveal text creating curiosity gap and immediate relevance",
        "colorScheme": "High-urgency warning palette: Dramatic red (#DC143C) with attention yellow (#FFD700) and stark black contrast creating maximum visual tension",
        "composition": {
          "layout": "central-focus",
          "visualFlow": "Immediate center focus (50%, 40%) → radiating urgency elements → text revelation → warning indicators, creating tunnel vision effect in under 2 seconds",
          "focalPoint": "Character face with intense authentic expression, dead center with dramatic spotlight effect for maximum psychological impact"
        },
        "characters": {
          "count": 1,
          "demographics": "Age 28-35, highly relatable appearance with authentic surprise/concern, diverse representation emphasizing genuine reaction over polished presentation",
          "expressions": ["shocked", "concerned", "intensely focused", "realizing", "alarmed"],
          "positioning": "Center-focused at 50% x, 40% y with 30% face size, slight forward lean indicating urgency, direct eye contact with viewer",
          "clothing": "Casual professional emphasizing relatability - slightly imperfect to suggest authentic reaction, muted colors not competing with urgency elements"
        },
        "objects": {
          "symbolic": [
            {"object": "warning triangle", "placement": {"x": 15, "y": 15, "size": 10}, "meaning": "important information requiring immediate attention", "prominence": "supporting"},
            {"object": "clock face", "placement": {"x": 75, "y": 70, "size": 12}, "meaning": "time pressure and deadline urgency", "prominence": "supporting"}
          ],
          "contextual": ["Story-specific shocking elements", "Hidden truth revelation indicators", "Before it's too late visual metaphors"],
          "emotional": [
            {"object": "spotlight effect", "placement": {"x": 50, "y": 40, "size": 60}, "trigger": "focus attention and create drama", "effect": "radial light emanating from character"}
          ]
        },
        "textStrategy": {
          "primary": "WHAT THEY DON'T TELL YOU",
          "font": "Impact black weight, 58px, 1.0 letter-spacing, 1.1 line-height",
          "placement": "Top area (15% y) for immediate urgency impact, centered, max 85% width",
          "color": "Attention yellow (#FFD700) with dramatic red (#DC143C) stroke (4px) and black shadow (3x, 3y, 6blur)",
          "background": {"color": "#1A1A1A", "opacity": 0.7, "borderRadius": 8}
        },
        "psychologicalTriggers": ["time_urgency", "status_anxiety", "fear_of_missing_out", "curiosity_gap"],
        "targetEmotion": "curiosity",
        "ctrOptimization": {
          "contrastLevel": "high",
          "emotionalIntensity": "intense",
          "clarityScore": 10
        }
      }
    ],
    "tags": ["motivation", "life-lessons", "personal-growth", "mindset", "success", "self-improvement"],
    "engagementHooks": [
      "Comment-driving questions placed throughout the script",
      "Moments designed to generate shares and saves",
      "Interactive elements that boost watch time"
    ]
  }
}

**QUALITY STANDARDS:**
- **MINIMUM WORD COUNT**: Script must contain at least ${minimumWords} words for proper ${targetDuration}-second video pacing
- **Content Depth**: Include detailed problem analysis, comprehensive solutions, implementation steps, and advanced techniques
- **Solution-Rich Content**: Every problem mentioned must have corresponding actionable solutions explained in detail
- Every sentence must serve a purpose: advance story, build tension, or provide insight
- No generic motivational clichés - make every insight feel fresh and profound
- Balance entertainment value with genuine life wisdom
- Create content that viewers will remember and reference in their own lives
- Ensure smooth pacing with no dead moments or filler content

**DURATION OPTIMIZATION:**
- Distribute ${targetDuration} seconds across ${sceneCount} scenes strategically
- Front-load engagement in first 15 seconds
- Build to emotional/intellectual climax around 60-70% mark  
- Reserve final 15-20 seconds for transformation and call-to-action
- Ensure every second adds value and maintains viewer interest`;
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
