# External APIs

The system integrates with four external APIs essential for the Reddit-to-video automation pipeline. Each integration includes authentication, rate limiting, and fallback strategies.

## Reddit API

- **Purpose:** Content discovery and metadata extraction from r/getmotivated subreddit
- **Documentation:** https://www.reddit.com/dev/api/
- **Base URL(s):** https://oauth.reddit.com/api/v1/
- **Authentication:** OAuth2 with client credentials flow, bearer token authentication
- **Rate Limits:** 60 requests per minute per OAuth client, 10 requests per second burst

**Key Endpoints Used:**

- `GET /r/{subreddit}/top` - Retrieve top weekly posts with comprehensive metadata
- `GET /api/info` - Get detailed post information by Reddit ID

**Integration Notes:** Requires Reddit app registration for client ID/secret. Store refresh tokens securely. Implement exponential backoff for rate limit compliance. Cache responses locally to minimize API calls.

## Claude API (Anthropic)

- **Purpose:** AI-powered script generation, scene breakdown, keyword extraction, and YouTube metadata creation
- **Documentation:** https://docs.anthropic.com/claude/reference/
- **Base URL(s):** https://api.anthropic.com/v1/
- **Authentication:** API key authentication via x-api-key header
- **Rate Limits:** Varies by subscription tier, typically 50 requests per minute

**Key Endpoints Used:**

- `POST /messages` - Generate video scripts with structured prompts and response formatting

**Integration Notes:** Leverage existing Claude Code subscription. Implement structured prompts for consistent output format. Use system prompts to maintain video script quality standards. Handle token limits with content chunking for long Reddit posts.

## Pexels API

- **Purpose:** Visual asset discovery and download for video background content
- **Documentation:** https://www.pexels.com/api/documentation/
- **Base URL(s):** https://api.pexels.com/v1/
- **Authentication:** API key authentication via Authorization header
- **Rate Limits:** 200 requests per hour (free tier), 20,000 requests per month

**Key Endpoints Used:**

- `GET /search` - Search for videos and photos using extracted keywords
- `GET /videos/search` - Dedicated video asset search with duration filtering

**Integration Notes:** Implement intelligent keyword fallback hierarchy (specific → generic → motivational stock). Cache popular assets locally to reduce API calls. Respect photographer attribution requirements. Consider Pexels Pro upgrade for higher rate limits.

## ElevenLabs API

- **Purpose:** Professional text-to-speech generation with timing data for video synchronization
- **Documentation:** https://elevenlabs.io/docs/api-reference/
- **Base URL(s):** https://api.elevenlabs.io/v1/
- **Authentication:** API key authentication via xi-api-key header
- **Rate Limits:** 10,000 characters per month (free tier), varies by subscription

**Key Endpoints Used:**

- `POST /text-to-speech/{voice_id}` - Generate high-quality narration audio
- `GET /voices` - Retrieve available voice profiles for narrator selection

**Integration Notes:** Implement Web Speech API fallback for development/testing. Extract word-level timing from audio response for Remotion synchronization. Choose voice profiles optimized for motivational content delivery. Monitor character usage to prevent service suspension.
