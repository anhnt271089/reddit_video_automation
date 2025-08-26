# Technical Assumptions

## Repository Structure: Monorepo

**Decision:** Single repository with pnpm workspaces containing `/app` (React frontend), `/server` (Node.js backend), `/shared` (TypeScript types), and `/templates` (Remotion components)

**Rationale:** Simplified dependency management, atomic deployments, and shared TypeScript types across all components. Enables rapid iteration with single command setup while maintaining clear separation of concerns for different system components.

## Service Architecture

**Architecture Pattern:** Single-process local development with event-driven processing

- **Core Processing:** Node.js 20+ with Fastify 4+ for high-performance API endpoints and WebSocket support
- **Frontend:** Vite + React 18 + TypeScript 5+ for fast development cycles and hot module replacement
- **Database:** SQLite with better-sqlite3 for development, PostgreSQL for production scaling
- **Video Processing:** Remotion 4+ for React-based programmatic video generation
- **State Management:** Zustand for lightweight, TypeScript-native frontend state without Redux complexity

## Testing Requirements

**Testing Strategy:** Pragmatic testing pyramid focusing on critical path validation

- **Unit Testing:** Vitest for both frontend and backend components with emphasis on core business logic
- **Integration Testing:** API endpoint testing with actual database integration using Vitest + Supertest
- **Manual Testing Convenience:** Built-in development tools for rapid workflow testing and debugging
- **No E2E Initially:** Focus on reliable unit and integration coverage for MVP, add Playwright later if needed

## Additional Technical Assumptions and Requests

**Development Environment:**

- **Package Management:** pnpm for faster installation and better disk efficiency compared to npm/yarn
- **Build Tooling:** Vite for frontend with sub-second hot reload, nodemon for backend auto-restart
- **TypeScript Configuration:** Strict mode with end-to-end type safety from database queries to UI components
- **Code Quality:** ESLint + Prettier with modern TypeScript rules, avoid complex configuration overhead

**External Integrations:**

- **Reddit API:** Direct fetch() calls with OAuth2 authentication and built-in rate limiting
- **Claude Integration:** Direct API calls leveraging existing Claude Code subscription, no service abstraction
- **Pexels API:** RESTful integration with local caching strategy and keyword-based search optimization
- **Text-to-Speech:** ElevenLabs API primary, Web Speech API fallback for local processing option

**Database Strategy:**

- **Development:** SQLite with synchronous operations for simplicity and file-based backup/version control
- **Schema Management:** Plain SQL migration files without ORM complexity, direct query execution
- **Production Scaling:** PostgreSQL compatibility maintained through standard SQL patterns

**Deployment & Operations:**

- **Local Development:** Single command startup (npm install && npm start) with automatic dependency resolution
- **Configuration Management:** Environment variables with .env files, no external configuration services
- **Error Handling:** Structured logging with Winston, console output for development, file logging for production
- **Process Management:** Simple process restart for error recovery, no complex orchestration requirements
