# Coding Standards

## Overview

This document defines the coding standards, style guidelines, and development practices for the video_automation project. All code must adhere to these standards to ensure consistency, maintainability, and quality.

## Language Standards

### TypeScript

- **Version**: TypeScript 5.0+
- **Strict mode**: Enabled (`"strict": true`)
- **Type coverage**: Aim for 95%+ type coverage
- **No `any` types**: Use proper typing or `unknown` when necessary
- **Prefer interfaces**: Use interfaces over type aliases for object shapes
- **Import organization**: Group imports (external → internal → relative)

### JavaScript/Node.js

- **Version**: Node.js 20+
- **Module system**: ESM modules preferred (`import/export`)
- **Async/await**: Prefer async/await over Promise chains
- **Error handling**: Always handle errors explicitly

## Code Formatting

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### ESLint Rules

- **Base**: `@typescript-eslint/recommended`
- **React**: `eslint-plugin-react-hooks`
- **Import order**: `eslint-plugin-import`
- **Unused imports**: Auto-remove unused imports
- **Console statements**: Warn on console.log (use proper logging)

## File and Directory Structure

### Naming Conventions

- **Files**: kebab-case (`video-service.ts`)
- **Directories**: kebab-case (`video-processing/`)
- **Components**: PascalCase (`VideoPlayer.tsx`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_VIDEO_SIZE`)
- **Functions/Variables**: camelCase (`generateVideo`)

### File Organization

```
src/
├── components/           # Reusable UI components
├── pages/               # Route components
├── services/            # Business logic
├── types/               # TypeScript definitions
├── utils/               # Helper functions
└── __tests__/           # Test files
```

## React Component Standards

### Component Structure

```typescript
// 1. Imports (external first, then internal)
import React, { useState, useEffect } from 'react';
import { VideoData } from '@video-automation/shared-types';

// 2. Types/Interfaces
interface VideoPlayerProps {
  video: VideoData;
  onPlay?: () => void;
}

// 3. Component
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onPlay
}) => {
  // Hooks first
  const [isPlaying, setIsPlaying] = useState(false);

  // Event handlers
  const handlePlay = () => {
    setIsPlaying(true);
    onPlay?.();
  };

  // Render
  return (
    <div className="video-player">
      {/* JSX content */}
    </div>
  );
};
```

### Hooks Rules

- **Custom hooks**: Start with `use` prefix
- **Dependency arrays**: Always specify dependencies
- **Effect cleanup**: Clean up subscriptions/timers
- **State updates**: Use functional updates for complex state

## Backend Standards

### API Design

- **REST conventions**: Use proper HTTP methods
- **Route naming**: Plural nouns (`/api/videos`)
- **Status codes**: Use appropriate HTTP status codes
- **Error responses**: Consistent error format
- **Validation**: Validate all inputs using schemas

### Database Standards

- **Naming**: snake_case for tables/columns
- **Relationships**: Use foreign keys with proper constraints
- **Migrations**: Sequential, reversible migrations
- **Indexes**: Index frequently queried columns

### Service Layer

```typescript
// Service class structure
export class VideoService {
  constructor(
    private readonly db: Database,
    private readonly logger: Logger
  ) {}

  async createVideo(data: CreateVideoRequest): Promise<Video> {
    this.logger.info('Creating video', { data });

    try {
      // Implementation
      return result;
    } catch (error) {
      this.logger.error('Failed to create video', { error, data });
      throw new ServiceError('Video creation failed');
    }
  }
}
```

## Testing Standards

### Test Structure

```typescript
describe('VideoService', () => {
  let service: VideoService;

  beforeEach(() => {
    // Setup
  });

  describe('createVideo', () => {
    it('should create video with valid data', async () => {
      // Arrange
      const mockData = { title: 'Test Video' };

      // Act
      const result = await service.createVideo(mockData);

      // Assert
      expect(result).toMatchObject({
        id: expect.any(String),
        title: 'Test Video',
      });
    });
  });
});
```

### Test Coverage

- **Unit tests**: 90%+ coverage for services
- **Integration tests**: API endpoints and database operations
- **E2E tests**: Critical user journeys
- **Component tests**: React Testing Library for UI components

## Error Handling

### Error Types

```typescript
// Custom error classes
export class ValidationError extends Error {
  constructor(
    message: string,
    public field: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ServiceError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
```

### Error Boundaries

- Use React Error Boundaries for UI error handling
- Log all errors with context
- Provide user-friendly error messages
- Implement retry mechanisms where appropriate

## Performance Standards

### Bundle Size

- **Frontend bundle**: < 500KB gzipped
- **Code splitting**: Lazy load routes and heavy components
- **Tree shaking**: Remove unused code
- **Asset optimization**: Optimize images and fonts

### API Performance

- **Response time**: < 200ms for most endpoints
- **Database queries**: Use indexes and optimize N+1 queries
- **Caching**: Cache expensive operations
- **Rate limiting**: Implement appropriate rate limits

## Security Standards

### Data Validation

- Validate all inputs at API boundaries
- Use schema validation (Joi, Zod, etc.)
- Sanitize user input to prevent XSS
- Use parameterized queries to prevent SQL injection

### Authentication/Authorization

- Store credentials securely (environment variables)
- Use JWT tokens with proper expiration
- Implement proper session management
- Follow principle of least privilege

## Documentation Standards

### Code Comments

- Use JSDoc for public APIs
- Explain "why" not "what"
- Keep comments up to date
- Document complex business logic

### README Files

- Setup instructions
- Development workflow
- API documentation
- Deployment process

## Development Workflow

### Git Standards

- **Commits**: Use conventional commit format
- **Branches**: Feature branches from main
- **PRs**: Require code review and tests
- **Merging**: Squash merge for clean history

### Code Review Process

1. Automated checks (lint, test, type-check)
2. Peer review focusing on:
   - Code correctness and logic
   - Performance implications
   - Security considerations
   - Standards compliance
3. Approval required before merge

### Continuous Integration

```yaml
# Required CI checks
- Lint (ESLint + Prettier)
- Type checking (TypeScript)
- Unit tests (Jest)
- Integration tests
- Bundle size check
- Security scan
```

## Tools and Scripts

### Development Commands

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Lint and format
pnpm lint
pnpm format

# Run tests
pnpm test
pnpm test:coverage

# Build production
pnpm build
```

### IDE Configuration

- **VS Code**: Recommended extensions and settings
- **Auto-format**: Format on save enabled
- **Auto-imports**: Organize imports on save
- **Type checking**: Real-time TypeScript errors

## Quality Metrics

### Code Quality Targets

- **Type coverage**: > 95%
- **Test coverage**: > 90%
- **Bundle size**: < 500KB gzipped
- **Lighthouse score**: > 90 for performance
- **Zero**: ESLint errors or warnings

### Monitoring

- Track bundle size changes
- Monitor test coverage trends
- Measure build/test execution times
- Code review metrics (time to review, approval rate)

---

_This document is living and should be updated as standards evolve. All team members are responsible for maintaining these standards._
