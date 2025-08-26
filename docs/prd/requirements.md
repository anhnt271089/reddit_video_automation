# Requirements

## Functional Requirements

**FR1:** The system shall automatically scrape r/getmotivated subreddit using Reddit API with OAuth2 authentication, retrieving posts with metadata (title, content, upvotes, comments, creation date) and storing in local SQLite database

**FR2:** The system shall provide a React-based approval interface displaying Reddit posts in card format with approve/reject buttons, enabling real-time content selection via WebSocket communication

**FR3:** The system shall integrate with Claude API using existing subscription to generate structured video scripts from approved Reddit posts, including automatic scene breakdown and keyword extraction

**FR4:** The system shall provide script review interface allowing manual approval, editing, and version control of AI-generated content before proceeding to asset generation

**FR5:** The system shall automatically search Pexels API for relevant video and image assets using extracted keywords and quotes from script content, with local caching for performance optimization

**FR6:** The system shall provide asset review interface enabling manual replacement of inappropriate or low-quality Pexels assets before video generation commitment

**FR7:** The system shall generate synchronized audio narration using text-to-speech integration with sentence-level timing extraction for precise audio-visual coordination

**FR8:** The system shall render complete videos using Remotion with typography animations displaying main keywords and key points per scene, synchronized with audio timing and background assets

**FR9:** The system shall maintain processing state persistence through local SQLite database, tracking content through all pipeline stages (discovery, approval, script, assets, rendering)

**FR10:** The system shall provide real-time WebSocket updates for dashboard synchronization and processing status without external service dependencies

## Non-Functional Requirements

**NFR1:** The system shall complete full video processing pipeline (Reddit post to finished video) within 30 minutes on standard development hardware (8-16GB RAM, modern CPU)

**NFR2:** The system shall maintain >95% video completion success rate with simple error recovery through process restart mechanisms

**NFR3:** The system shall respect API rate limits: Reddit (60 requests/minute), Pexels (200 requests/hour free tier), preventing service suspension

**NFR4:** The system shall operate within 1GB RAM footprint for all components combined, enabling deployment on standard development machines

**NFR5:** The system shall provide <30 second hot-reload development cycles for both frontend and backend components using modern tooling

**NFR6:** The system shall maintain <10 core dependencies total, avoiding complex abstraction layers and reducing security surface area

**NFR7:** The system shall enable complete setup and deployment through single command execution (npm install && npm start) without external service configuration

**NFR8:** The system shall achieve >80% relevant asset matching between Pexels content and script themes through intelligent keyword extraction and manual review gates
