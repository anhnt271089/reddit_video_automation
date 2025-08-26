# Project Brief: Simplified Reddit-to-Video Automation Workflow

## Executive Summary

This project develops a streamlined video automation workflow that transforms Reddit content into YouTube videos, learning from the previous over-engineered system. The solution focuses on essential functionality using modern, lightweight technologies to reduce complexity while maintaining core automation capabilities.

The primary problem being solved is the technical debt and operational complexity of the previous system, which used heavy infrastructure (Google Cloud Run, complex queue systems, multiple APIs) that created maintenance overhead. Our target approach emphasizes local development, simpler dependencies, and cleaner architecture.

The key value proposition is achieving 80% of the previous system's capabilities with 20% of the complexity, enabling faster iteration, easier maintenance, and reduced operational costs while maintaining the core Reddit-to-video pipeline.

## Problem Statement

The previous Reddit-to-Video automation system, while functionally successful, became operationally unsustainable due to over-engineering. The system required complex infrastructure management (Google Cloud Run, Redis clusters, multiple AI API integrations, Bull Queue monitoring) that consumed more time in maintenance than it saved in content creation.

**Current state and pain points:**

- **Technical Debt:** 25+ interconnected components requiring constant monitoring and updates
- **Operational Overhead:** Cloud infrastructure costs and complexity outweighed automation benefits
- **Development Friction:** Complex deployment pipeline slowed iteration and feature development
- **Maintenance Burden:** System failures required deep technical debugging rather than simple fixes

**Impact of the problem:**

- Development velocity decreased as complexity grew
- Operational costs increased without proportional value gain
- Single points of failure in complex queue systems caused complete workflow stops
- Technical maintenance time exceeded content creation time savings

**Why existing solutions (including our previous approach) fall short:**

- Over-abstraction: Built enterprise-grade infrastructure for individual creator needs
- Premature optimization: Solved scaling problems before validating core workflow
- Technology stacking: Used multiple best-in-class tools that created integration complexity
- Feature creep: Implemented comprehensive solution before proving MVP value

**Urgency and importance of solving this now:**
Content automation remains valuable, but must be sustainable long-term. The current choice is between maintaining an increasingly complex system or rebuilding with learned constraints. Rebuilding now with modern, simpler technologies prevents further technical debt accumulation.

## Proposed Solution

Our simplified Reddit-to-Video automation workflow creates a lean, maintainable content pipeline that preserves the core value of the previous system while eliminating operational complexity through modern, lightweight technologies and local-first architecture.

**Core Concept:**
The system operates through a streamlined workflow: Reddit posts → idea selection → AI-generated script content (Claude subscription) → approval → script breakdown into sentences/scenes → keyword extraction → Pexels asset search → asset review with manual replacement → voice generation → Remotion video generation with typography displaying main keywords and key points per scene.

**Key Architecture Changes from Previous System:**

- **Local-First Development:** Replace Google Cloud Run with local Node.js server, eliminating deployment complexity
- **Single Database:** Replace Google Sheets API + Redis + Bull Queue with single database for all state management
- **Direct Processing:** Replace complex job queues with simple async processing and modern JavaScript concurrency
- **Modern Stack:** Use latest Node.js 20+, TypeScript 5+, and Vite for development speed and maintainability
- **Minimal Dependencies:** Focus on essential packages only, avoiding over-abstraction

**Enhanced Workflow Pipeline:**

1. **Reddit Content Discovery** → Local SQLite storage with engagement metrics
2. **Idea Selection Interface** → Simple React cards with approve/reject workflow
3. **Claude-Generated Script Content** → Structured prompt using existing Claude Code subscription
4. **Script Approval & Review** → Edit interface with version control and approval tracking
5. **Intelligent Scene Breakdown** → Automatic sentence/scene parsing with keyword/quote extraction
6. **Smart Pexels Asset Search** → Automated video/image retrieval using extracted search phrases
7. **Asset Review & Manual Replacement** → Visual interface for asset quality control and substitution
8. **Voice Generation** → TTS integration with sentence-level timing for synchronization
9. **Remotion Video Generation** → Typography animations displaying keywords/key points per scene with synchronized audio

**Key Differentiators from Previous System:**

- **Operational Simplicity:** Single command startup vs. multi-service orchestration
- **Development Velocity:** Hot reload and modern tooling vs. complex deployment pipeline
- **Maintenance Overhead:** File-based configuration vs. cloud resource management
- **Cost Structure:** Zero operational costs vs. cloud service fees
- **Quality Control:** Manual asset review gates ensure visual content standards

## Target Users

### Primary User Segment: Solo Technical Content Creators

**Demographic Profile:**

- Individual developers or technical creators managing their own YouTube channels
- 25-40 years old with software development or technical background
- Comfortable with local development setup and command-line tools
- Currently producing 1-3 videos per week manually
- Revenue goals of $10K-100K annually through content monetization

**Current Behaviors and Workflows:**

- Spend 3-5 hours weekly browsing Reddit for content inspiration manually
- Use basic video editing tools (CapCut, DaVinci Resolve) with significant manual effort
- Manage content pipeline through personal notes, spreadsheets, or simple task managers
- Deploy and maintain personal projects locally or on simple hosting platforms

**Specific Needs and Pain Points:**

- **Technical Sustainability:** Need tools they can modify, understand, and maintain long-term
- **Development Workflow Integration:** Want content automation that fits their existing technical workflow
- **Operational Control:** Prefer local control over external service dependencies
- **Cost Management:** Need predictable, low operational costs without monthly SaaS fees
- **Iteration Speed:** Want to experiment and modify automation without complex deployment cycles

### Secondary User Segment: Technical YouTube Automation Entrepreneurs

**Demographic Profile:**

- Developers or technical entrepreneurs running multiple YouTube channels
- 30-45 years old with software engineering or product management background
- Building portfolio of content channels for diversified revenue streams
- Comfortable with local development, APIs, and system integration
- Target revenue: $50K-500K annually across multiple channels

**Current Behaviors and Workflows:**

- Manage multiple content pipelines using custom scripts and automation tools
- Prefer self-hosted solutions over external dependencies for cost and control
- Use technical skills to build competitive advantages in content creation
- Focus on systematizing and optimizing content creation processes

## Goals & Success Metrics

### Business Objectives

- **Development Velocity:** Reduce feature development time from weeks to days, achieving 3x faster iteration cycles through simplified architecture and modern tooling
- **Operational Sustainability:** Achieve <2 hours monthly maintenance time vs. previous system's weekly debugging requirements, enabling long-term project viability
- **Setup Simplicity:** Enable complete system setup in <30 minutes with single command installation vs. previous multi-hour cloud deployment process
- **Cost Optimization:** Eliminate recurring operational costs (cloud services, managed databases) while maintaining equivalent functionality through local-first architecture
- **Technical Debt Reduction:** Maintain <10 core dependencies vs. previous system's 25+ components, reducing complexity and security surface area

### User Success Metrics

- **Content Processing Speed:** Maintain 1-3 videos per day throughput with <10 minutes active oversight per video vs. previous manual 2-4 hour research cycles
- **System Reliability:** Achieve >95% successful video completion rate with simple error recovery (process restart) vs. previous complex queue debugging
- **Developer Experience:** Enable hot-reload development cycles <30 seconds vs. previous deployment-dependent testing cycles
- **Learning Curve:** New technical users can understand and modify system within 4 hours vs. previous enterprise-complexity learning requirements
- **Customization Success:** Users can implement custom features or modifications within single development session vs. previous multi-service coordination

### Key Performance Indicators (KPIs)

#### Technical Performance KPIs

- **Build Time:** Complete project build and startup <2 minutes on modern development machine
- **Memory Usage:** System operation within 1GB RAM footprint for all components vs. previous cloud resource requirements
- **Dependency Health:** <5% of dependencies requiring major version updates annually, indicating stable, mature technology choices
- **Error Recovery Time:** System restoration from failure <5 minutes through simple process management vs. previous complex debugging
- **Development Iteration Speed:** Feature implementation and testing cycles <1 hour vs. previous deployment-dependent development

#### Content Quality KPIs

- **Processing Success Rate:** >90% of approved Reddit posts successfully generate complete videos without manual intervention
- **Content Relevance:** Maintain scoring system accuracy from previous implementation (85% correlation between scores and performance)
- **Asset Match Quality:** >80% relevant Pexels assets automatically selected based on extracted keywords and quotes
- **Audio-Visual Synchronization:** Sentence-level timing accuracy within 200ms tolerance for professional video quality

## MVP Scope

### Core Features (Must Have)

- **Simplified Reddit Content Discovery:** Basic Node.js scraper for r/getmotivated using Reddit API, storing posts in local SQLite database with engagement metrics (upvotes, comments, age) and simple scoring algorithm without complex weighting

- **Streamlined Approval Interface:** Single-page React application displaying discovered content in card format with approve/reject buttons, real-time updates via WebSocket connection, and local database state management without external API dependencies

- **Claude Script Generation Pipeline:** Integration with existing Claude Code subscription for AI-generated script content, structured prompts converting Reddit posts into video scripts with automatic scene breakdown and keyword extraction

- **Script Review and Approval System:** React interface displaying generated scripts with approval workflow, edit capabilities, and automatic sentence/scene parsing for asset keyword extraction

- **Smart Pexels Asset Integration:** Automated video/image search using extracted keywords and quotes, local asset caching, and manual replacement interface for quality control before video generation

- **Voice Generation Pipeline:** Text-to-speech integration with sentence-level timing extraction for precise audio-visual synchronization in final video output

- **Remotion Video Generation:** Typography templates displaying main keywords and key points per scene, synchronized with audio timing and Pexels background assets, producing professional YouTube-ready MP4 output

- **Local Database Management:** SQLite for development with simple schema (posts, scripts, assets, generated_videos), direct SQL queries without ORM complexity, and file-based configuration for easy backup and version control

### Out of Scope for MVP

- Multiple subreddit support (focus on r/getmotivated only)
- Complex scoring algorithms with multiple weighted factors
- Advanced Remotion templates and animation effects
- Cloud deployment and infrastructure management
- Real-time collaboration features and team workflows
- Advanced error handling and retry logic systems
- External notification systems (Telegram, email, etc.)
- Multi-channel management and batch processing capabilities
- Advanced analytics and performance prediction features
- Custom voice options and advanced TTS features

### MVP Success Criteria

**MVP is considered successful when:**

- System can process 1 approved Reddit post through complete pipeline (discovery → approval → script → assets → voice → video generation) within 30 minutes of local setup and execution
- Generates 1 complete video daily with relevant Pexels background assets, synchronized audio, and professional typography animations
- Maintains local database consistency with all content states tracked accurately without external dependencies
- Achieves 80% video completion rate without requiring code modifications or complex debugging procedures
- Demonstrates clear development velocity improvement: adding new features takes hours instead of previous system's weeks
- Provides simple local deployment: single npm install && npm start command brings entire system online functionally

## Post-MVP Vision

### Phase 2 Features

**Enhanced Content Intelligence (Weeks 3-4):**

- Multi-subreddit support expanding to r/decidingtobebetter and r/getdisciplined with community-specific content adaptation
- Advanced scoring algorithm incorporating emotional impact weighting and trend validation through simple Google Trends checks
- Content categorization system enabling template matching based on post themes (motivation, discipline, habits)

**Audio Integration & Enhanced Videos (Weeks 5-6):**

- Multiple voice options and advanced TTS integration using ElevenLabs for professional narration quality
- Enhanced audio-text synchronization with word-level timing for precise typography animations
- Multiple Remotion templates with different emotional styles (motivational, contemplative, urgent)

**Workflow Optimization (Weeks 7-8):**

- Batch processing capabilities handling 3-5 videos concurrently using modern JavaScript Worker threads
- Smart approval suggestions based on historical performance data and scoring patterns
- Enhanced error recovery with automatic retry logic and graceful degradation

### Long-term Vision

**Intelligence & Personalization (6-12 months):**

- Machine learning integration for content performance prediction using lightweight TensorFlow.js models
- Dynamic template selection based on content emotional analysis and historical engagement patterns
- Advanced Reddit analysis incorporating comment sentiment and engagement velocity patterns
- Personalized content curation based on channel performance history and audience preferences

**Developer Ecosystem & Extensions (Year 1-2):**

- Plugin architecture enabling community-developed extensions and custom processing modules
- API framework allowing integration with external tools and services (Discord bots, Slack notifications, custom dashboards)
- Template marketplace for sharing custom Remotion templates and animation styles
- Configuration presets for different content types and channel styles

## Technical Considerations

### Platform Requirements

- **Target Platforms:** Local development environment (primary), with optional containerized deployment for advanced users
- **Browser/OS Support:** Modern Node.js environments (20+), Chrome/Firefox/Safari for dashboard interface, macOS/Windows/Linux compatibility
- **Performance Requirements:** <5 seconds video processing initiation, <30 seconds for basic 2-minute video generation, real-time dashboard updates via WebSocket, concurrent processing capability for 2-3 videos on standard development hardware

### Technology Preferences

**Frontend:**

- **Dashboard Framework:** Vite + React 18 + TypeScript for fast development cycles and excellent developer experience
- **UI Components:** Radix UI primitives with Tailwind CSS for modern, accessible component design without heavy framework dependencies
- **State Management:** Zustand for lightweight, TypeScript-native state management without Redux complexity
- **Real-time Updates:** Native WebSocket API for dashboard synchronization, avoiding Socket.io overhead

**Backend:**

- **Core Framework:** Node.js 20+ with Fastify 4+ for high-performance API endpoints and WebSocket support
- **Database:** SQLite for development simplicity, PostgreSQL for production scaling, using native SQL queries without ORM abstraction
- **Video Processing:** Remotion 4+ for React-based video generation, leveraging existing TypeScript skills for template development
- **External APIs:** Direct fetch() calls to Reddit API and Pexels API, avoiding axios or complex HTTP client dependencies

**Database:**

- **Development:** SQLite with better-sqlite3 for synchronous, file-based database operations and simple backup/version control
- **Production:** PostgreSQL with node-postgres for advanced features while maintaining SQL compatibility
- **Migration Strategy:** Plain SQL migration files for database schema changes, avoiding complex ORM migration systems

### Architecture Considerations

**Repository Structure:**

- **Monorepo Organization:** Single repository with `/app` (frontend), `/server` (backend), `/shared` (types), and `/templates` (Remotion) directories
- **Modern Package Management:** pnpm workspaces for efficient dependency management and faster installation cycles
- **Configuration Management:** Environment-based configuration files (.env) with validation and type safety

**Service Architecture:**

- **Single Process Design:** Combined API server and background processing in single Node.js process for development simplicity
- **Event-Driven Processing:** Modern EventEmitter patterns for loose coupling between content discovery, approval, and video generation stages
- **Graceful Error Handling:** Structured error logging with context preservation and automatic recovery for transient failures

**Integration Requirements:**

- **Reddit Integration:** Official Reddit API with OAuth2 authentication, respecting rate limits through simple queuing mechanisms
- **Pexels Assets:** Pexels API integration for both video and image assets with local caching and keyword-based search, fallback to local asset library
- **Video Generation:** Direct Remotion CLI integration with programmatic rendering control and progress monitoring
- **AI Integration:** Direct Claude API calls using existing subscription with circuit breaker pattern for reliability

## Constraints & Assumptions

### Constraints

- **Budget:** Minimal operational costs targeting <$50/month for API usage (Reddit API free tier, Pexels API rate limits, occasional AI API calls)
- **Timeline:** MVP functional within 2 weeks, complete Phase 1 implementation within 6 weeks to validate simplified architecture approach
- **Resources:** Single developer operation optimized for individual contributor workflow, limited to personal development hardware (8-16GB RAM, modern CPU)
- **Technical:**
  - Pexels API rate limits (200 requests/hour for free tier, 20,000/month for basic paid tier)
  - Reddit API restrictions (60 requests per minute, OAuth2 authentication required)
  - Local processing power constraints for video rendering (targeting 2-5 minute videos maximum)
  - Node.js single-thread limitations requiring careful async processing design
  - Remotion rendering performance dependent on local hardware specifications

### Key Assumptions

- **Content Availability:** r/getmotivated maintains consistent 10+ quality posts weekly suitable for video content conversion
- **API Stability:** Reddit and Pexels APIs maintain current functionality and rate limit structures throughout development period
- **Technology Maturity:** Node.js 20+ and modern JavaScript ecosystem provide sufficient performance for local video processing workflows
- **Development Velocity:** Simplified architecture enables 3x faster feature development compared to previous cloud-based system
- **Asset Quality:** Pexels video and image library contains sufficient relevant content for motivational/self-help video backgrounds
- **Processing Capacity:** Standard development hardware (8GB+ RAM) handles concurrent video processing for 2-3 videos without performance degradation
- **Market Demand:** Technical creator community values local-first, customizable solutions over managed SaaS platforms
- **Content Quality:** Automated Pexels asset selection provides adequate visual relevance for Reddit-based content themes using extracted keywords and quotes

## Risks & Open Questions

### Key Risks

- **Pexels Asset Match Quality:** Automated keyword extraction from Reddit posts may not provide sufficiently relevant video/image assets from Pexels, potentially resulting in generic or mismatched visual content that reduces viewer engagement and emotional connection

- **Local Processing Performance Limitations:** Single Node.js process handling concurrent video rendering may overwhelm standard development hardware, causing system slowdowns, memory exhaustion, or failed video generation during peak processing periods

- **Reddit API Dependency Vulnerability:** Changes to Reddit API rate limits, authentication requirements, or content access policies could disrupt content discovery pipeline, requiring rapid adaptation or alternative content source implementation

- **Simplification Over-Correction:** Removing too much complexity from previous system might eliminate essential functionality, leading to inadequate automation that doesn't provide sufficient value over manual content creation processes

- **Claude Integration Dependency:** Reliance on existing Claude Code subscription for script generation creates single point of failure for content creation pipeline if subscription changes or API access issues occur

### Open Questions

- **How will Pexels video quality and variety compare to image assets for background content?** → Need research into Pexels video library coverage for motivational content themes
- **What's the optimal balance between automation speed and local resource usage?** → Requires performance testing with various hardware configurations and concurrent processing loads
- **How can we validate script quality without complex approval workflows?** → Need simple quality metrics and review interfaces that maintain content standards
- **What's the minimum viable Remotion template complexity for acceptable video engagement?** → Requires A/B testing with actual YouTube performance data
- **How do we handle Reddit content that doesn't translate well to video format?** → Need content filtering criteria beyond basic length and engagement metrics

### Areas Needing Further Research

- **Pexels API Coverage Analysis:** Evaluate video and image availability for common self-help themes (motivation, productivity, personal growth) to identify content gaps and keyword optimization strategies
- **Local Hardware Performance Benchmarking:** Test video processing performance across different hardware specifications (8GB vs 16GB+ RAM, integrated vs discrete graphics) to establish minimum requirements
- **Reddit Content Pattern Analysis:** Study r/getmotivated posting patterns, seasonal trends, and content themes to optimize scraping schedules and content categorization
- **Remotion Template Design Patterns:** Analyze successful YouTube typography animation styles to develop template specifications that balance simplicity with engagement

## Next Steps

### Immediate Actions

1. **Setup simplified project structure** with modern monorepo using pnpm workspaces: `/app` (React+Vite), `/server` (Node.js+Fastify), `/shared` (TypeScript types), `/templates` (Remotion components)

2. **Implement Reddit discovery pipeline** using Reddit API to pull r/getmotivated posts, store in local SQLite with basic engagement scoring, and create simple approval interface for idea selection

3. **Integrate Claude API for script generation** leveraging existing Claude Code subscription for content creation, implementing structured prompts that convert Reddit posts into video scripts with scene breakdowns

4. **Build script review and approval system** with React interface displaying generated scripts, approval workflow, and automatic sentence/scene parsing for asset keyword extraction

5. **Create Pexels integration with smart asset matching** using extracted keywords and quotes to search for relevant videos/images, implementing local caching and manual asset replacement interface

6. **Develop voice generation pipeline** integrating text-to-speech service (ElevenLabs or Web Speech API) with sentence-level timing extraction for precise audio-visual synchronization

7. **Implement Remotion video generation** with typography templates displaying main keywords and key points per scene, synchronized with audio timing and Pexels background assets

8. **Setup local development environment** with hot reload, TypeScript configuration, and integrated testing workflow for rapid iteration and modification

### Technical Implementation Roadmap

**Week 1: Core Infrastructure**

- Project setup with modern tooling (Node.js 20+, Vite, TypeScript 5+, SQLite)
- Reddit API integration with OAuth2 and rate limiting
- Basic React dashboard for content review and approval
- Claude API integration for script generation with structured output

**Week 2: Content Processing Pipeline**

- Script parsing system for sentence/scene breakdown and keyword extraction
- Pexels API integration with keyword-based search and local asset caching
- Asset review interface with manual replacement capabilities
- Basic voice generation integration with timing data extraction

**Week 3-4: Video Generation & Refinement**

- Remotion template development with typography animations and scene transitions
- Audio-visual synchronization system using extracted timing data
- Complete workflow testing from Reddit post to finished video
- Performance optimization for local hardware constraints

**Week 5-6: Polish & Optimization**

- Error handling and recovery mechanisms for each pipeline stage
- User experience improvements based on initial testing feedback
- Documentation creation for setup, usage, and customization
- Performance benchmarking and optimization for standard development hardware

### PM Handoff

This Project Brief provides comprehensive context for building a simplified, maintainable Reddit-to-Video automation workflow. The system learns from previous over-engineering by focusing on essential functionality with modern, local-first architecture.

**Critical Success Factors:**

- **Workflow Clarity:** The refined pipeline (Reddit → Idea Selection → Claude Script → Approval → Scene Breakdown → Pexels Assets → Review → Voice → Remotion Video) provides clear implementation roadmap
- **Technology Modernization:** 2025 JavaScript ecosystem enables simpler solutions than previous cloud-complex approach
- **Local-First Benefits:** Eliminates operational overhead while maintaining full control and customization capability
- **Claude Integration:** Existing subscription provides reliable script generation without additional API costs
- **Asset Quality Control:** Manual review gate ensures visual content meets standards before video generation commitment

**Key Implementation Priorities:**

1. **Start Simple:** Single subreddit, basic templates, local SQLite to prove architecture viability
2. **Iterate Fast:** Modern tooling enables rapid development cycles for quick validation and refinement
3. **Preserve Control:** Manual approval gates maintain content quality while scaling automation benefits
4. **Focus Sustainability:** Optimize for long-term maintainability over short-term feature richness

---

## Document Version

**Version:** 1.0  
**Date:** 2025-08-25  
**Author:** Mary (Business Analyst)  
**Status:** Ready for Development
