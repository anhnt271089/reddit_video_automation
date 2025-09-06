import {
  RedditPost,
  ProcessedContent,
  GeneratedScript,
  ValidationResult,
} from './types';

export class ContentProcessor {
  preprocessPost(post: RedditPost): ProcessedContent {
    return {
      title: this.sanitizeTitle(post.title),
      content: this.extractMainContent(post),
      metadata: {
        author: post.author,
        subreddit: post.subreddit,
        score: post.score,
        awards: post.awards || [],
        wordCount: this.countWords(post.content),
        readingTime: this.calculateReadingTime(post.content),
      },
    };
  }

  validateScript(script: GeneratedScript): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    // Check required fields
    if (!script.scriptContent || script.scriptContent.trim().length === 0) {
      errors.push('Script content is missing or empty');
      score -= 30;
    }

    if (!script.sceneBreakdown || script.sceneBreakdown.length === 0) {
      errors.push('Scene breakdown is missing or empty');
      score -= 25;
    }

    if (!script.titles || script.titles.length !== 5) {
      errors.push('Must have exactly 5 title variations');
      score -= 15;
    }

    // Validate scene breakdown
    if (script.sceneBreakdown) {
      const totalDuration = script.sceneBreakdown.reduce(
        (sum, scene) => sum + scene.duration,
        0
      );
      const targetDuration = script.generationParams?.targetDuration || 60;

      if (Math.abs(totalDuration - targetDuration) > 10) {
        warnings.push(
          `Duration mismatch: ${totalDuration}s vs target ${targetDuration}s`
        );
        score -= 10;
      }

      script.sceneBreakdown.forEach((scene, index) => {
        if (!scene.narration || scene.narration.trim().length === 0) {
          errors.push(`Scene ${index + 1} is missing narration`);
          score -= 10;
        }

        if (!scene.visualKeywords || scene.visualKeywords.length === 0) {
          warnings.push(`Scene ${index + 1} is missing visual keywords`);
          score -= 5;
        }

        if (scene.duration <= 0 || scene.duration > 120) {
          errors.push(
            `Scene ${index + 1} has invalid duration: ${scene.duration}s`
          );
          score -= 10;
        }
      });
    }

    // Validate titles
    if (script.titles) {
      script.titles.forEach((title, index) => {
        if (!title || title.trim().length === 0) {
          errors.push(`Title ${index + 1} is empty`);
          score -= 5;
        } else if (title.length > 100) {
          warnings.push(
            `Title ${index + 1} is too long (${title.length} chars)`
          );
          score -= 3;
        } else if (title.length < 10) {
          warnings.push(
            `Title ${index + 1} is too short (${title.length} chars)`
          );
          score -= 3;
        }
      });
    }

    // Validate description
    if (!script.description || script.description.trim().length === 0) {
      warnings.push('Description is missing');
      score -= 5;
    } else if (script.description.length < 50) {
      warnings.push('Description is too short for good SEO');
      score -= 3;
    }

    // Validate keywords
    if (!script.keywords || script.keywords.length === 0) {
      warnings.push('Keywords are missing');
      score -= 5;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
    };
  }

  private sanitizeTitle(title: string): string {
    // Remove Reddit formatting and clean up
    return title
      .replace(/\[.*?\]/g, '') // Remove [brackets]
      .replace(/\(.*?\)/g, '') // Remove (parentheses) if they contain metadata
      .trim()
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  private extractMainContent(post: RedditPost): string {
    let content = post.content || '';

    // Remove common Reddit artifacts
    content = content
      .replace(/^Edit:.*$/gm, '') // Remove edit lines
      .replace(/^Update:.*$/gm, '') // Remove update lines
      .replace(/^TL;DR:.*$/gm, '') // Remove TL;DR (we'll create our own)
      .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
      .replace(/r\/[^\s]+/g, '') // Remove subreddit references
      .replace(/u\/[^\s]+/g, '') // Remove user mentions
      .trim();

    // Limit content length for optimal processing
    if (content.length > 2000) {
      content = content.substring(0, 2000) + '...';
    }

    return content;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private calculateReadingTime(text: string): number {
    const wordsPerMinute = 200;
    const wordCount = this.countWords(text);
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Content quality scoring
  scoreContent(post: RedditPost): number {
    let score = 0;

    // Engagement metrics (40% of score)
    const engagementScore = Math.min(post.score / 100, 1) * 40;
    score += engagementScore;

    // Content length (20% of score)
    const wordCount = this.countWords(post.content);
    const lengthScore =
      wordCount > 50 && wordCount < 500 ? 20 : wordCount > 25 ? 15 : 10;
    score += lengthScore;

    // Title quality (20% of score)
    const titleScore =
      post.title.length > 10 && post.title.length < 150 ? 20 : 15;
    score += titleScore;

    // Comments engagement (20% of score)
    const commentScore = Math.min(post.comments / 20, 1) * 20;
    score += commentScore;

    return Math.round(score);
  }

  // Extract key themes and topics
  extractThemes(content: string): string[] {
    const themes: string[] = [];
    const commonThemes = [
      'success',
      'failure',
      'motivation',
      'relationship',
      'work',
      'family',
      'money',
      'health',
      'education',
      'travel',
      'technology',
      'funny',
      'life lesson',
      'achievement',
      'challenge',
      'transformation',
    ];

    const lowerContent = content.toLowerCase();

    commonThemes.forEach(theme => {
      if (
        lowerContent.includes(theme) ||
        lowerContent.includes(theme.replace(' ', ''))
      ) {
        themes.push(theme);
      }
    });

    return themes;
  }

  // Detect content warnings/flags
  detectContentFlags(post: RedditPost): string[] {
    const flags: string[] = [];
    const content = (post.title + ' ' + post.content).toLowerCase();

    const sensitiveTopics = [
      'suicide',
      'depression',
      'abuse',
      'violence',
      'drugs',
      'alcohol',
      'politics',
      'religion',
      'nsfw',
      'death',
      'medical',
    ];

    sensitiveTopics.forEach(topic => {
      if (content.includes(topic)) {
        flags.push(topic);
      }
    });

    // Check for excessive profanity
    const profanityCount = (content.match(/\b(fuck|shit|damn|ass)\b/g) || [])
      .length;
    if (profanityCount > 3) {
      flags.push('profanity');
    }

    return flags;
  }
}
