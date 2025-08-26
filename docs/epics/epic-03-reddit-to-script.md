# Epic 3: Core Reddit-to-Script Pipeline

## Epic Goal

Build the complete content discovery and script generation workflow from Reddit post discovery through AI-powered script creation with approval interfaces.

## Epic Description

**Pipeline Components:**

- Reddit content discovery with scoring
- Content approval dashboard
- AI script generation via Claude
- Script review and editing interface
- Scene breakdown and keyword extraction

**What's Being Built:**

- Content discovery dashboard UI
- Scoring algorithm for post quality
- Approval workflow with state tracking
- Claude prompt engineering for scripts
- Script parsing and scene analysis
- Review interface with editing

**Success Criteria:**

- 10+ Reddit posts discovered daily
- Scoring accuracy >80% for quality
- Scripts generated in <30 seconds
- Scene breakdown with timing data
- Keywords extracted for asset search

## Stories

### Story 1: Content Discovery Dashboard

- Create React component for post cards
- Implement filtering and sorting
- Add batch approval actions
- Build real-time WebSocket updates
- Store approval state in database

### Story 2: Content Scoring System

- Implement engagement scoring algorithm
- Factor in upvotes, comments, age
- Create quality thresholds
- Add manual score adjustment
- Display scores in dashboard

### Story 3: Script Generation Pipeline

- Design Claude prompt templates
- Generate structured scripts
- Extract titles and descriptions
- Create thumbnail suggestions
- Handle script versioning

### Story 4: Script Review Interface

- Build script display component
- Add inline editing capability
- Implement approval workflow
- Parse scenes and sentences
- Extract keywords for assets

## Definition of Done

- [ ] Reddit posts display with scores
- [ ] Approval updates database state
- [ ] Scripts generated from approved posts
- [ ] Scene breakdown completed automatically
- [ ] Keywords extracted for each scene
- [ ] Review interface fully functional
