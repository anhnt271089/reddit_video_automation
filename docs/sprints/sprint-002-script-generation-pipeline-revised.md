# Sprint 002: AI-Powered Script Generation Pipeline (REVISED)

**Duration:** 1.5 weeks (7 working days) - REDUCED FROM 2 WEEKS  
**Start Date:** TBD  
**End Date:** TBD  
**Sprint Type:** Backend Integration + Queue Management

## ✅ **MAJOR UPDATE: Foundation Already Complete**

**Existing Claude Code Implementation Discovered:**

- `apps/server/src/services/claude-code/scriptGenerator.ts` ✅ COMPLETE
- `apps/server/src/services/claude-code/prompts.ts` ✅ COMPLETE
- `apps/server/src/services/claude-code/types.ts` ✅ COMPLETE
- `apps/server/src/services/claude-code/contentProcessor.ts` ✅ COMPLETE

**Sprint Effort Reduced:** 8 days → **5 days** (37% reduction)

## Sprint Goals 🎯

1. **Integrate Existing Claude Code Service** - Connect proven script generation to pipeline workflow
2. **Implement Queue Management System** - Create robust job processing with WebSocket updates
3. **Build API Integration Layer** - Expose script generation via REST endpoints
4. **Complete Database Integration** - Add versioning, quality tracking, and job persistence

## Success Metrics 📊

- [ ] Queue system processing multiple script requests using existing Claude Code service
- [ ] WebSocket updates showing real-time generation progress to users
- [ ] Database integration with script versioning and quality tracking
- [ ] API endpoints fully integrated with existing `ClaudeCodeScriptGenerator`
- [ ] 95%+ test coverage on new integration code
- [ ] End-to-end workflow: Reddit post approval → existing script generation → database storage

## User Stories

### Story 3.3: Script Generation Pipeline (Integration Focus)

**Priority:** P1  
**Effort:** 5 days (REDUCED - leveraging existing implementation)  
**Status:** Ready for Implementation  
**Description:** Complete pipeline integration using proven Claude Code service with queue management, database persistence, and API endpoints

**Foundation Status:** ✅ **Core script generation logic complete and tested**

## Revised Sprint Backlog

### Week 1: Database & Queue Integration (Days 1-3)

#### Day 1: Database Schema & Integration ✅ **COMPLETED**

- [x] Create database migration (4h)
  - Extended video_scripts table with generation metadata
  - Generation queue table for job tracking
  - Version tracking and quality scoring fields
- [x] Update data models (4h)
  - Integrate existing `GeneratedScript` interface with database
  - Map `SceneData` to database schema
  - Add versioning and quality tracking fields

#### Day 2: Queue Management Foundation

- [ ] Create `apps/server/src/queue/generationQueue.ts` (6h)
  - FIFO job processing with priority support
  - **Direct integration with existing `ClaudeCodeScriptGenerator`**
  - Job persistence and reliability mechanisms
  - Concurrent generation limits (max 3 simultaneous)
- [ ] Implement job processing workflow (6h)
  - Job creation calling `scriptGenerator.generateScript()`
  - Progress tracking and completion handling
  - Error handling with retry attempts using existing retry logic

#### Day 3: WebSocket Integration & Monitoring

- [ ] WebSocket progress integration (6h)
  - Real-time progress updates during generation
  - Queue position notifications for waiting jobs
  - Integration with existing WebSocket infrastructure
- [ ] Queue monitoring and health checks (4h)
  - Processing time tracking and bottleneck identification
  - Error rate monitoring with alerting system
- [ ] Testing queue under load (2h)

### Week 2: API Integration & Testing (Days 4-5)

#### Day 4: API Endpoints & Service Integration

- [ ] Create `apps/server/src/routes/api/scripts.ts` (6h)
  - `POST /api/scripts/generate` - Trigger existing `generateScript()`
  - `GET /api/scripts/:postId` - Retrieve stored scripts
  - `POST /api/scripts/:postId/regenerate` - Use existing `regenerateScript()`
  - `GET /api/generation/queue` - Queue status monitoring
- [ ] Request validation and response formatting (4h)
  - Parameter validation for existing service interface
  - Consistent JSON schema across endpoints
- [ ] Error handling and logging integration (2h)

#### Day 5: Testing & Quality Control

- [ ] Comprehensive integration testing (6h)
  - Test existing Claude Code service through new API endpoints
  - Queue processing tests with actual `ClaudeCodeScriptGenerator`
  - Database transaction testing for script storage
- [ ] End-to-end workflow validation (4h)
  - Complete pipeline: post approval → queue → Claude Code → database
  - WebSocket message validation and flow testing
- [ ] Performance optimization (2h)
  - Memory usage optimization for existing script generation
  - Queue throughput optimization

## Technical Specifications

### Existing Claude Code Service Integration

```typescript
// Leveraging proven implementation
import { ClaudeCodeScriptGenerator } from '../services/claude-code';

const generator = new ClaudeCodeScriptGenerator();

// Queue job processing
const script = await generator.generateScript({
  redditPost: approvedPost,
  targetDuration: 60,
  style: 'motivational',
  sceneCount: 4,
});
```

### Key Files Structure (Updated)

```
apps/server/src/
├── services/claude-code/          # ✅ EXISTING - COMPLETE
│   ├── scriptGenerator.ts         # Core generation logic ✅
│   ├── prompts.ts                 # Advanced prompt templates ✅
│   ├── types.ts                   # TypeScript interfaces ✅
│   ├── contentProcessor.ts        # Reddit post processing ✅
│   └── index.ts                   # Service exports ✅
├── queue/                         # NEW - TO CREATE
│   └── generationQueue.ts         # Integration with existing service
├── routes/api/                    # NEW - TO CREATE
│   └── scripts.ts                 # API endpoints using existing service
└── migrations/                    # NEW - TO CREATE
    └── 005_add_script_generation.sql
```

## Dependencies & Blockers

### Prerequisites ✅ COMPLETE

- [x] Story 3.1: Content Discovery Dashboard
- [x] Claude Code service implementation and testing
- [x] WebSocket infrastructure established
- [x] Database models framework ready

### Integration Points

- **Existing Service:** `ClaudeCodeScriptGenerator` class ready for use
- **Proven Methods:** `generateScript()`, `regenerateScript()`, `generateVariations()`
- **Complete Types:** `ScriptGenerationRequest`, `GeneratedScript`, `SceneData`

## Risk Register (Updated)

| Risk                     | Probability | Impact | Mitigation Strategy                              |
| ------------------------ | ----------- | ------ | ------------------------------------------------ |
| Integration complexity   | Low         | Medium | Existing service well-structured for integration |
| Queue system reliability | Medium      | Medium | Incremental testing + existing retry logic       |
| Database mapping issues  | Low         | Medium | Clear interface mapping from existing types      |

## Definition of Done (Revised)

- [ ] Queue system successfully processes jobs using existing Claude Code service
- [ ] All API endpoints integrated with proven `ClaudeCodeScriptGenerator`
- [ ] Database schema supports existing `GeneratedScript` interface
- [ ] WebSocket integration delivers real-time progress updates
- [ ] Comprehensive tests validate integration (not core generation logic)
- [ ] Script versioning and quality tracking functional
- [ ] No regression in existing Claude Code service functionality
- [ ] End-to-end workflow tested and documented

## Sprint Success Impact

**Accelerated Delivery:** By leveraging existing implementation:

- ✅ **37% effort reduction** (8 days → 5 days)
- ✅ **Proven script generation** already tested
- ✅ **Advanced prompt engineering** complete
- ✅ **Scene breakdown logic** validated
- ✅ **Multiple script styles** supported

**Focus Areas:**

- Database integration and persistence
- Queue management and reliability
- API endpoint exposure and validation
- WebSocket progress communication

---

**Sprint Status:** In Progress - Day 1 Complete  
**Last Updated:** August 28, 2025  
**Sprint Master:** Bob (BMad Scrum Master)  
**Major Revision:** Leverages existing Claude Code implementation

## Sprint Progress 🚀

**Day 1 (Task 5) - COMPLETED ✅**

- Database migration created with comprehensive versioning schema
- ScriptVersionManager service implemented with full CRUD operations
- Type integration between Claude Code and shared types completed
- 18 comprehensive tests passing - 100% coverage
- Integration ready for queue system

**Files Implemented:**

- `apps/server/migrations/005_add_script_generation.sql` - Database schema
- `apps/server/src/services/scriptVersionManager.ts` - Core versioning service
- `apps/server/src/services/scriptVersionManager.test.ts` - Test suite
- Updated: `packages/shared/src/types/models.ts` - Added versioning types

**Next:** Day 2 - Queue Management Foundation
