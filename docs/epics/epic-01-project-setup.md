# Epic 1: Project Setup & Infrastructure - Greenfield Foundation

## Epic Goal

Establish the complete development environment, project structure, and core infrastructure to enable Reddit-to-Video automation development with modern local-first architecture.

## Epic Description

**Project Context:**

- **New Project:** Greenfield Reddit-to-Video automation system
- **Technology Stack:** Node.js 20+, TypeScript 5+, React 18, Vite, Fastify, SQLite/PostgreSQL, Remotion
- **Architecture:** Local-first monorepo with pnpm workspaces

**What's Being Built:**

- Complete project scaffolding and repository structure
- Development environment with hot reload capabilities
- Database infrastructure with migrations
- API server foundation with WebSocket support
- Frontend dashboard shell with routing
- Shared TypeScript types package
- Development tooling and scripts

**Success Criteria:**

- Single command setup (`pnpm install && pnpm dev`)
- All core services running locally
- Hot reload working for both frontend and backend
- Database connected and migrations applied

## Stories

### Story 1: Initialize Project Structure and Repository

- Create monorepo with pnpm workspaces
- Setup directory structure (apps/web, apps/server, packages/shared)
- Initialize git repository with .gitignore
- Create README with setup instructions

### Story 2: Setup Backend Infrastructure

- Initialize Fastify server with TypeScript
- Setup SQLite database with better-sqlite3
- Create database migrations system
- Implement WebSocket support
- Add environment configuration (.env)

### Story 3: Setup Frontend Infrastructure

- Initialize React 18 with Vite and TypeScript
- Configure Tailwind CSS and Radix UI
- Setup Zustand for state management
- Create basic routing structure
- Implement WebSocket client connection

### Story 4: Establish Shared Types and Dev Workflow

- Create shared TypeScript types package
- Setup ESLint and Prettier configuration
- Configure development scripts in package.json
- Implement hot reload for all packages
- Add health-check command

## Definition of Done

- [ ] `pnpm install` installs all dependencies successfully
- [ ] `pnpm dev` starts both frontend and backend
- [ ] Database migrations run without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Backend API responds at http://localhost:3001
- [ ] WebSocket connection established
- [ ] Hot reload works for code changes
- [ ] TypeScript compilation passes
- [ ] Project structure follows architecture document
