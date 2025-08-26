# Tech Stack

This is the DEFINITIVE technology selection for the entire project. All development must use these exact versions.

## Technology Stack Table

| Category             | Technology                                        | Version       | Purpose                           | Rationale                                                              |
| -------------------- | ------------------------------------------------- | ------------- | --------------------------------- | ---------------------------------------------------------------------- |
| Frontend Language    | TypeScript                                        | 5.0+          | Type-safe frontend development    | Eliminates runtime errors, enables better IDE support, PRD requirement |
| Frontend Framework   | React                                             | 18.2+         | UI component architecture         | Mature ecosystem, team familiarity, Remotion compatibility             |
| UI Component Library | Tailwind CSS + Radix UI                           | 3.3+ / 1.0+   | Styling and accessible components | Rapid prototyping, accessibility built-in, developer-friendly          |
| State Management     | Zustand                                           | 4.4+          | Lightweight React state           | TypeScript-native, minimal boilerplate, PRD simplicity requirement     |
| Backend Language     | TypeScript                                        | 5.0+          | Full-stack type safety            | Shared types across frontend/backend, single language ecosystem        |
| Backend Framework    | Fastify                                           | 4.0+          | High-performance HTTP server      | WebSocket support, plugin ecosystem, faster than Express               |
| API Style            | REST + WebSocket                                  | -             | HTTP API + real-time updates      | Simple for CRUD operations, WebSocket for pipeline status              |
| Database             | SQLite → PostgreSQL                               | 3.42+ → 15+   | Development → Production scaling  | Local-first development, production compatibility                      |
| Cache                | Node.js Map + Redis (prod)                        | - / 7.0+      | In-memory → distributed caching   | Simple development, scalable production                                |
| File Storage         | Local FS → Google Drive API / DigitalOcean Spaces | - / v3 / 2.x+ | Asset and video storage           | Development simplicity, cost-effective production scaling              |
| Authentication       | Simple JWT                                        | -             | Basic session management          | Minimal complexity for single-user development tool                    |
| Frontend Testing     | Vitest + React Testing Library                    | 1.0+ / 13.0+  | Component and unit testing        | Fast, modern test runner with React integration                        |
| Backend Testing      | Vitest + Supertest                                | 1.0+ / 6.3+   | API integration testing           | Consistent tooling across frontend/backend                             |
| E2E Testing          | Playwright (future)                               | 1.40+         | End-to-end workflow validation    | Deferred to post-MVP, reliable automation testing                      |
| Build Tool           | Vite                                              | 5.0+          | Frontend bundling and dev server  | Sub-second HMR, modern tooling, TypeScript native                      |
| Bundler              | Vite (frontend) + tsc (backend)                   | 5.0+ / 5.0+   | Asset bundling and compilation    | Optimized for development speed                                        |
| IaC Tool             | Vercel Config + GitHub Actions                    | -             | Deployment automation             | Simple, integrated with chosen platform                                |
| CI/CD                | GitHub Actions                                    | -             | Automated testing and deployment  | Free for public repos, excellent ecosystem                             |
| Monitoring           | Vercel Analytics + Console Logs                   | -             | Basic performance tracking        | Minimal setup, development-focused                                     |
| Logging              | Winston                                           | 3.11+         | Structured logging                | Development console + production file logs                             |
| CSS Framework        | Tailwind CSS                                      | 3.3+          | Utility-first styling             | Rapid UI development, consistent design system                         |
