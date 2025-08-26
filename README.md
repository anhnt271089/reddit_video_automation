# Video Automation

Simplified Reddit-to-Video automation workflow with local-first architecture.

## Overview

This project automates the creation of motivational videos from Reddit posts using modern JavaScript tooling and AI-powered content generation. The system processes Reddit posts through Claude-generated scripts, Pexels asset integration, and Remotion video generation.

## Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm (Package manager)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd video_automation

# Install dependencies
pnpm install

# Copy environment templates
cp .env.example .env
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# Configure your environment variables (see Environment Setup)
```

## Development Commands

```bash
# Start development servers (frontend + backend)
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Run linting
pnpm lint

# Format code
pnpm format
```

## Project Structure

```
video_automation/
├── apps/
│   ├── web/                    # React frontend (Vite + TypeScript)
│   └── server/                 # Fastify backend (Node.js + TypeScript)
├── packages/
│   ├── shared/                 # Shared TypeScript types
│   └── remotion-templates/     # Video generation templates
├── assets/
│   ├── music/                  # Background music files
│   ├── cache/                  # Pexels asset cache
│   └── videos/                 # Generated video outputs
├── docs/                       # Architecture and documentation
├── scripts/                    # Build and deployment scripts
└── configuration files...
```

## Environment Setup

### Required API Keys

1. **Reddit API** - OAuth2 credentials for content discovery
2. **Claude API** - For AI-powered script generation
3. **Pexels API** - For video/image asset sourcing
4. **ElevenLabs API** - For text-to-speech generation

### Configuration Files

- `apps/server/.env` - Backend configuration
- `apps/web/.env` - Frontend configuration
- See `.env.example` files for required variables

## Architecture

This project uses:

- **Monorepo**: pnpm workspaces for efficient dependency management
- **Frontend**: React 18 + TypeScript 5 + Vite + Tailwind CSS
- **Backend**: Fastify 4 + TypeScript 5 + SQLite → PostgreSQL
- **Video Generation**: Remotion 4 for programmatic video creation
- **Build System**: Turbo for optimized builds with caching

## Development Workflow

1. **Content Discovery**: Scrape Reddit posts with engagement scoring
2. **Script Generation**: AI-powered script creation with Claude
3. **Asset Matching**: Intelligent Pexels asset selection
4. **Video Generation**: Remotion-based video rendering with synchronization

## Links

- [Architecture Documentation](docs/architecture.md)
- [Product Requirements](docs/prd.md)
- [Development Standards](docs/architecture/coding-standards.md)

## License

MIT License - see [LICENSE](LICENSE) file for details.
