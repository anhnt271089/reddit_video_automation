# Unified Project Structure

Monorepo structure accommodating both frontend and backend with shared packages, tooling, and development workflow.

```
video_automation/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       ├── deploy.yaml
│       └── test.yaml
├── apps/                       # Application packages
│   ├── web/                    # Frontend application
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   ├── pages/          # Page components/routes
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── services/       # API client services
│   │   │   ├── stores/         # Zustand state management
│   │   │   ├── styles/         # Global styles/themes
│   │   │   └── utils/          # Frontend utilities
│   │   ├── public/             # Static assets
│   │   ├── tests/              # Frontend tests
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   └── package.json
│   └── server/                 # Backend application
│       ├── src/
│       │   ├── routes/         # API routes/controllers
│       │   ├── services/       # Business logic services
│       │   ├── models/         # Data models
│       │   ├── middleware/     # Fastify middleware
│       │   ├── utils/          # Backend utilities
│       │   ├── external/       # External API clients
│       │   ├── queue/          # Processing queue manager
│       │   └── server.ts       # Fastify server entry
│       ├── tests/              # Backend tests
│       ├── migrations/         # Database migrations
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   ├── constants/      # Shared constants
│   │   │   ├── utils/          # Shared utilities
│   │   │   └── validators/     # Data validation schemas
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   └── styles/         # Component styles
│   │   └── package.json
│   ├── remotion-templates/     # Video templates
│   │   ├── src/
│   │   │   ├── templates/      # Remotion video templates
│   │   │   ├── animations/     # Typography animations
│   │   │   └── compositions/   # Video compositions
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── eslint/
│       ├── typescript/
│       ├── jest/
│       └── prettier/
├── assets/                     # Static assets
│   ├── music/                  # Background music library
│   │   ├── motivational/
│   │   ├── contemplative/
│   │   ├── urgent/
│   │   └── neutral/
│   ├── cache/                  # Pexels asset cache
│   └── videos/                 # Generated video outputs
├── docs/                       # Documentation
│   ├── prd.md
│   ├── architecture.md
│   └── api-reference.md
├── scripts/                    # Build/deploy scripts
│   ├── setup.sh
│   ├── dev.sh
│   ├── build.sh
│   └── deploy.sh
├── .env.example                # Environment template
├── package.json                # Root package.json with workspaces
├── pnpm-workspace.yaml         # pnpm workspaces configuration
├── turbo.json                  # Build pipeline configuration
├── .gitignore
└── README.md
```
