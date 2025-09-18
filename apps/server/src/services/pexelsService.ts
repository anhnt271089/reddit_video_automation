import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { pipeline } from 'stream/promises';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
  video_pictures: {
    id: number;
    picture: string;
    nr: number;
  }[];
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos?: PexelsPhoto[];
  videos?: PexelsVideo[];
  next_page?: string;
}

export class PexelsService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.pexels.com/v1';
  private readonly videoBaseUrl = 'https://api.pexels.com/videos';
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 1000; // 1 second between requests

  constructor() {
    this.apiKey = config.apiKeys.pexels;
  }

  /**
   * Generate a short, unique ID from a full UUID
   */
  private generateShortId(fullId: string): string {
    // Take first 8 characters of UUID and ensure uniqueness with timestamp
    const shortBase = fullId.replace(/-/g, '').substring(0, 8);
    return shortBase;
  }

  /**
   * Ensure minimum time between API requests to respect rate limits
   */
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      logger.info(
        `Rate limiting: waiting ${waitTime}ms before next Pexels API call`
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
  }

  private async makeRequest(url: string): Promise<any> {
    await this.waitForRateLimit();

    const response = await fetch(url, {
      headers: {
        Authorization: this.apiKey,
        'User-Agent': 'Reddit Video Automation Bot/1.0',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        // If we still get rate limited, wait longer and throw a specific error
        logger.warn('Pexels API rate limit exceeded, backing off');
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        throw new Error('Pexels API rate limit exceeded');
      }
      throw new Error(
        `Pexels API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Search for photos
   */
  async searchPhotos(
    query: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<PexelsSearchResponse> {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    logger.info(`Searching Pexels photos: ${query}`);
    return this.makeRequest(url);
  }

  /**
   * Search for videos
   */
  async searchVideos(
    query: string,
    page: number = 1,
    perPage: number = 10
  ): Promise<PexelsSearchResponse> {
    const url = `${this.videoBaseUrl}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
    logger.info(`Searching Pexels videos: ${query}`);
    return this.makeRequest(url);
  }

  /**
   * Download asset to file system
   */
  async downloadAsset(
    downloadUrl: string,
    filePath: string,
    assetType: 'photo' | 'video'
  ): Promise<string> {
    try {
      logger.info(`Downloading ${assetType} from Pexels:`, {
        url: downloadUrl,
        destination: filePath,
      });

      // Ensure directory exists
      await mkdir(dirname(filePath), { recursive: true });

      // Download the file
      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Reddit Video Automation Bot/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`
        );
      }

      if (!response.body) {
        throw new Error('No response body for download');
      }

      // Stream the file to disk
      const fileStream = createWriteStream(filePath);
      await pipeline(response.body, fileStream);

      logger.info(`Successfully downloaded ${assetType} to: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error(`Failed to download asset:`, error);
      throw error;
    }
  }

  /**
   * Get best quality download URL for a photo
   */
  getBestPhotoUrl(photo: PexelsPhoto): string {
    return photo.src.original || photo.src.large2x || photo.src.large;
  }

  /**
   * Check if asset has landscape aspect ratio (width > height) suitable for 16:9 format
   */
  private isLandscapeAspectRatio(asset: PexelsPhoto | PexelsVideo): boolean {
    return asset.width > asset.height;
  }

  /**
   * Filter assets to prefer 16:9 aspect ratio for landscape videos
   */
  private filterByAspectRatio<T extends PexelsPhoto | PexelsVideo>(
    assets: T[]
  ): T[] {
    const landscapeAssets = assets.filter(asset =>
      this.isLandscapeAspectRatio(asset)
    );
    // If we have landscape assets, return them; otherwise return original array
    return landscapeAssets.length > 0 ? landscapeAssets : assets;
  }

  /**
   * Get best quality download URL for a video
   */
  getBestVideoUrl(video: PexelsVideo): string {
    // Prefer HD quality, fallback to SD, then any available
    const hdVideo = video.video_files.find(f => f.quality === 'hd');
    if (hdVideo) {
      return hdVideo.link;
    }

    const sdVideo = video.video_files.find(f => f.quality === 'sd');
    if (sdVideo) {
      return sdVideo.link;
    }

    // Return first available video file
    return video.video_files[0]?.link || '';
  }

  /**
   * Search and get a random asset for a search phrase (ensures variety)
   */
  async searchAndGetBest(
    searchPhrase: string,
    assetType: 'photo' | 'video'
  ): Promise<{ asset: PexelsPhoto | PexelsVideo; downloadUrl: string } | null> {
    try {
      // Prioritize relevance: start with page 1 (most relevant results)
      const maxResults = 30;
      const searchPage = 1; // Always use page 1 for best relevance

      let response: PexelsSearchResponse;

      if (assetType === 'photo') {
        response = await this.searchPhotos(
          searchPhrase,
          searchPage,
          maxResults
        );
        if (response.photos && response.photos.length > 0) {
          // Filter for 16:9 landscape aspect ratio preference
          const filteredPhotos = this.filterByAspectRatio(response.photos);

          // Smart selection: prioritize top relevant results with light randomization
          const assetsToChoose =
            filteredPhotos.length > 0 ? filteredPhotos : response.photos;
          const selectedPhoto = this.selectBestRelevantAsset(assetsToChoose);

          logger.info(
            `Selected photo from ${assetsToChoose.length} options (${filteredPhotos.length}/${response.photos.length} landscape) for "${searchPhrase}"`
          );

          return {
            asset: selectedPhoto,
            downloadUrl: this.getBestPhotoUrl(selectedPhoto),
          };
        }
      } else {
        response = await this.searchVideos(
          searchPhrase,
          searchPage,
          maxResults
        );
        if (response.videos && response.videos.length > 0) {
          // Filter for 16:9 landscape aspect ratio preference
          const filteredVideos = this.filterByAspectRatio(response.videos);

          // Smart selection: prioritize top relevant results with light randomization
          const assetsToChoose =
            filteredVideos.length > 0 ? filteredVideos : response.videos;
          const selectedVideo = this.selectBestRelevantAsset(assetsToChoose);

          logger.info(
            `Selected video from ${assetsToChoose.length} options (${filteredVideos.length}/${response.videos.length} landscape) for "${searchPhrase}"`
          );

          return {
            asset: selectedVideo,
            downloadUrl: this.getBestVideoUrl(selectedVideo),
          };
        }
      }

      return null;
    } catch (error) {
      logger.error(
        `Failed to search ${assetType} for "${searchPhrase}":`,
        error
      );
      return null;
    }
  }

  /**
   * Smart asset selection that prioritizes relevance while adding light variety
   */
  private selectBestRelevantAsset<T>(assets: T[]): T {
    if (assets.length === 1) {
      return assets[0];
    }

    // For 2-3 assets: choose from all available results
    if (assets.length <= 3) {
      const randomIndex = Math.floor(Math.random() * assets.length);
      return assets[randomIndex];
    }

    // For more assets: prioritize top 5 results (most relevant) with weighted randomization
    const topResults = Math.min(5, assets.length);

    // Weighted selection: higher chance for earlier (more relevant) results
    // Weight: 5 for 1st, 4 for 2nd, 3 for 3rd, 2 for 4th, 1 for 5th
    const weights = Array.from(
      { length: topResults },
      (_, i) => topResults - i
    );
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    let randomValue = Math.random() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      randomValue -= weights[i];
      if (randomValue <= 0) {
        return assets[i];
      }
    }

    // Fallback to first result (most relevant)
    return assets[0];
  }

  /**
   * Search with smart fallback phrases if no results
   */
  async searchWithFallback(
    searchPhrase: string,
    assetType: 'photo' | 'video'
  ): Promise<{ asset: PexelsPhoto | PexelsVideo; downloadUrl: string } | null> {
    // Try original search phrase first
    let result = await this.searchAndGetBest(searchPhrase, assetType);
    if (result) {
      return result;
    }

    // Generate fallback phrases by simplifying the search
    const fallbackPhrases = this.generateFallbackPhrases(
      searchPhrase,
      assetType
    );

    // Try fallback phrases with exponential backoff to reduce API pressure
    for (let i = 0; i < fallbackPhrases.length; i++) {
      const fallbackPhrase = fallbackPhrases[i];

      // Add progressive delay for fallback attempts to reduce API load
      if (i > 0) {
        const backoffDelay = Math.min(500 * i, 2000); // 500ms, 1s, 1.5s, 2s max
        logger.info(
          `Backing off ${backoffDelay}ms before trying fallback phrase: "${fallbackPhrase}"`
        );
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }

      logger.info(
        `Trying fallback phrase: "${fallbackPhrase}" for original: "${searchPhrase}"`
      );

      try {
        result = await this.searchAndGetBest(fallbackPhrase, assetType);
        if (result) {
          logger.info(`Found asset using fallback phrase: "${fallbackPhrase}"`);
          return result;
        }
      } catch (error) {
        // If we hit a rate limit error, wait longer before continuing
        if (error instanceof Error && error.message.includes('rate limit')) {
          logger.warn(
            `Rate limit hit on fallback attempt ${i + 1}, waiting longer`
          );
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        // For other errors, just continue to next fallback
      }
    }

    return null;
  }

  /**
   * Generate fallback phrases for better search results
   */
  private generateFallbackPhrases(
    searchPhrase: string,
    assetType: 'photo' | 'video'
  ): string[] {
    const fallbacks: string[] = [];

    // Step 1: Try simplified two-word combinations first
    const words = this.extractUsableWords(searchPhrase);

    // Create simple two-word combinations from the most meaningful words
    for (let i = 0; i < Math.min(words.length, 3); i++) {
      for (let j = i + 1; j < Math.min(words.length, 4); j++) {
        fallbacks.push(`${words[i]} ${words[j]}`);
      }
    }

    // Step 2: Add individual meaningful words (avoid very short words)
    fallbacks.push(...words.filter(word => word.length > 3));

    // Step 3: Add conceptual abstractions for complex terms
    const concepts = this.extractConcepts(searchPhrase);
    fallbacks.push(...concepts);

    // Step 4: Add generic category fallbacks based on asset type
    if (assetType === 'photo') {
      fallbacks.push(
        'abstract',
        'minimalist',
        'nature',
        'modern',
        'colorful',
        'concept'
      );
    } else {
      fallbacks.push(
        'motion',
        'dynamic',
        'flowing',
        'cinematic',
        'smooth',
        'abstract'
      );
    }

    // Remove duplicates and return
    return [...new Set(fallbacks)];
  }

  /**
   * Extract usable words from complex search phrases
   */
  private extractUsableWords(searchPhrase: string): string[] {
    const words: string[] = [];

    // Split by spaces and hyphens, clean up each word
    const rawWords = searchPhrase
      .toLowerCase()
      .split(/[\s\-_]+/)
      .map(word => word.replace(/[^a-z]/g, ''))
      .filter(word => word.length > 2);

    // Prioritize meaningful words (nouns, adjectives, verbs)
    const meaningfulWords = rawWords.filter(
      word => !this.isStopWord(word) && word.length > 3
    );

    // If we have meaningful words, use them; otherwise use all cleaned words
    return meaningfulWords.length > 0 ? meaningfulWords : rawWords;
  }

  /**
   * Extract broader concepts from complex phrases
   */
  private extractConcepts(searchPhrase: string): string[] {
    const concepts: string[] = [];
    const phrase = searchPhrase.toLowerCase();

    // Map complex concepts to simpler visual terms
    const conceptMap: Record<string, string[]> = {
      habit: ['routine', 'lifestyle', 'daily'],
      formation: ['building', 'creating', 'developing'],
      mindset: ['thinking', 'psychology', 'mental'],
      transformation: ['change', 'growth', 'evolution'],
      inspiration: ['motivation', 'success', 'achievement'],
      productivity: ['work', 'efficiency', 'focus'],
      wellness: ['health', 'fitness', 'lifestyle'],
      meditation: ['peace', 'calm', 'zen'],
      technology: ['modern', 'digital', 'innovation'],
      creativity: ['art', 'design', 'imagination'],
      business: ['professional', 'corporate', 'office'],
      learning: ['education', 'study', 'knowledge'],
    };

    // Check for concept matches and add simpler alternatives
    for (const [concept, alternatives] of Object.entries(conceptMap)) {
      if (phrase.includes(concept)) {
        concepts.push(...alternatives);
      }
    }

    return concepts;
  }

  /**
   * Check if a word is a stop word (common words with little visual meaning)
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'between',
      'among',
      'this',
      'that',
      'these',
      'those',
      'you',
      'your',
      'is',
      'are',
      'was',
      'were',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'should',
      'could',
      'can',
      'may',
      'might',
      'must',
      'shall',
      'a',
      'an',
    ]);
    return stopWords.has(word);
  }

  /**
   * Generate short, logical filename for asset
   */
  generateFilename(
    scriptId: string,
    sentenceId: number,
    assetId: number,
    assetType: 'photo' | 'video'
  ): string {
    const extension = assetType === 'photo' ? 'jpg' : 'mp4';
    const shortId = this.generateShortId(scriptId);
    const shortAssetType = assetType === 'photo' ? 'p' : 'v';
    return `${shortId}_s${sentenceId}_${shortAssetType}${assetId}.${extension}`;
  }

  /**
   * Get full file path in organized assets directory structure
   */
  getAssetPath(
    filename: string,
    scriptId: string,
    assetType: 'photo' | 'video'
  ): string {
    // Save to organized folder structure: assets/{shortId}/{assetType}s/
    const assetsDir = join(process.cwd(), '../../assets');
    const shortId = this.generateShortId(scriptId);
    const scriptDir = join(assetsDir, shortId);
    const typeDir = join(scriptDir, `${assetType}s`); // photos/ or videos/

    return join(typeDir, filename);
  }
}
