# Epic 2: External API Integrations

## Epic Goal

Establish secure, rate-limited integrations with all external APIs (Reddit, Claude, Pexels, ElevenLabs) required for the content pipeline, ensuring reliable data flow and proper credential management.

## Epic Description

**Integration Requirements:**

- **Reddit API:** OAuth2 authentication for r/getmotivated scraping
- **Claude API:** Leverage existing subscription for script generation
- **Pexels API:** Free tier integration for video/image assets
- **ElevenLabs API:** Text-to-speech with timing data extraction

**What's Being Built:**

- OAuth2 flow for Reddit authentication
- API client services with rate limiting
- Secure credential storage system
- Local caching layer for API responses
- Error handling and retry logic
- API health monitoring

**Success Criteria:**

- All APIs successfully authenticated
- Rate limits properly enforced
- Credentials securely stored in .env
- Cache reducing API calls by 50%+

## Stories

### Story 1: Reddit API Integration

- Implement OAuth2 authentication flow
- Create Reddit API client service
- Setup rate limiting (60 req/min)
- Build subreddit scraping for r/getmotivated
- Store posts with metadata in database

### Story 2: Claude API Integration

- Setup Claude API client with existing key
- Create structured prompt templates
- Implement script generation service
- Parse Claude responses into structured data
- Handle token limits and chunking

### Story 3: Pexels API Integration

- Register for Pexels API key
- Create asset search service
- Implement local file caching
- Build relevance scoring algorithm
- Handle rate limits (200/hour)

### Story 4: ElevenLabs API Integration

- Setup TTS service with API key
- Implement voice selection
- Extract word-level timing data
- Create audio file management
- Build fallback to Web Speech API

## Definition of Done

- [ ] All API keys configured in .env.example
- [ ] Each API client has error handling
- [ ] Rate limiting prevents API suspension
- [ ] Cache layer reduces redundant calls
- [ ] Integration tests pass for each API
- [ ] Fallback strategies documented
