# Epic 1: Foundation & Content Discovery Infrastructure

**Epic Goal:** Establish core project infrastructure with Reddit API integration, local database setup, and basic content approval workflow while delivering immediate Reddit content discovery functionality that replaces manual browsing with automated, scored content curation.

## Story 1.1: Project Infrastructure & Environment Setup

As a **developer**,  
I want **complete project infrastructure configured with monorepo structure, modern tooling, and all required API integrations**,  
so that **I have a solid foundation for building the automation pipeline with rapid development cycles and external service connectivity**.

### Acceptance Criteria

1. Monorepo structure created with pnpm workspaces: `/app` (React+Vite+TypeScript), `/server` (Node.js+Fastify), `/shared` (TypeScript types), `/templates` (Remotion components)
2. Local development environment with single command startup (npm install && npm start) bringing all services online
3. SQLite database setup with initial schema: posts, approvals, scripts, assets, videos tables
4. Environment configuration with .env files for API keys: Reddit OAuth2, Claude, Pexels, ElevenLabs
5. Hot reload configured for both frontend (Vite HMR) and backend (nodemon) with <30 second iteration cycles
6. Basic health check endpoints responding successfully for all services with status verification

## Story 1.2: Reddit Content Discovery Engine

As a **content curator**,  
I want **automated Reddit scraping that retrieves top weekly posts from r/getmotivated with comprehensive engagement data**,  
so that **I have a consistent pipeline of high-quality content candidates without manual browsing and research time**.

### Acceptance Criteria

1. Reddit API client with OAuth2 authentication and rate limiting compliance (60 requests/minute)
2. Automated daily job retrieves top 10 weekly posts from r/getmotivated subreddit
3. Post data extraction includes: title, content, URL, author, upvotes, comment count, creation date, awards
4. Basic engagement scoring calculation incorporating upvote velocity and comment engagement ratios
5. Content filtering excludes posts under 100 words or over 2000 words for optimal video length suitability
6. Scraped content stored in SQLite with proper indexing for efficient retrieval and status tracking

## Story 1.3: Content Approval Dashboard Interface

As a **content curator**,  
I want **clean React dashboard displaying discovered Reddit posts with scoring data and one-click approval actions**,  
so that **I can efficiently review and approve video ideas with clear information and rapid decision-making capability**.

### Acceptance Criteria

1. React 18 dashboard with TypeScript displaying content from SQLite database in responsive card layout
2. Content filtering and sorting by engagement score, date, word count, and approval status
3. Individual content cards showing Reddit title, engagement metrics, suggested video length, and source link
4. One-click approve/reject buttons with immediate database updates and real-time UI state changes
5. WebSocket integration providing real-time updates for processing status and queue changes
6. Search functionality for finding specific content by keywords, author, or content themes
7. Bulk operations enabling batch approval/rejection of multiple content items for efficiency

## Story 1.4: Basic Content Scoring & Prioritization

As a **content curator**,  
I want **intelligent content scoring that identifies the most promising Reddit posts for video creation**,  
so that **I can prioritize high-potential content without manually evaluating engagement metrics and content quality**.

### Acceptance Criteria

1. Scoring algorithm incorporating Reddit engagement (upvotes, comments, awards) with time-decay factors
2. Content quality assessment based on word count, narrative structure, and emotional language patterns
3. Visual potential scoring analyzing content for Pexels asset keyword extraction and search viability
4. Automated score calculation on content import with persistent storage and historical tracking
5. Dashboard display with color-coded score indicators (green >8.0, yellow 6-8, red <6) for quick identification
6. Score breakdown details showing individual component contributions for transparency and optimization
7. Manual score override capability allowing curator judgment to supersede automated assessment

## Story 1.5: Database Management & State Tracking

As a **system administrator**,  
I want **reliable data persistence and state management tracking content through all pipeline stages**,  
so that **the system maintains data integrity and provides clear visibility into content processing status**.

### Acceptance Criteria

1. SQLite database schema supporting all content lifecycle stages with proper foreign key relationships
2. Content state transitions tracked: discovered → approved → scripted → assets_ready → rendered → completed
3. Audit logging for all state changes with timestamp, user action, and context information
4. Database backup and recovery procedures with file-based version control integration
5. Data cleanup routines removing orphaned records and managing database size growth
6. Performance optimization with appropriate indexes for common query patterns and dashboard loading
7. Migration system for schema updates supporting development iteration without data loss
