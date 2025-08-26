# Contributing to Video Automation

## Development Setup

1. Ensure Node.js 20+ and pnpm are installed
2. Clone the repository and install dependencies:
   ```bash
   pnpm install
   ```
3. Copy environment templates and configure API keys
4. Start development servers:
   ```bash
   pnpm dev
   ```

## Development Guidelines

### Code Standards

- Follow the [Coding Standards](docs/architecture/coding-standards.md)
- Use TypeScript 5+ with strict mode enabled
- Format code with Prettier before committing
- Ensure ESLint passes without warnings

### Commit Guidelines

- Use conventional commit format: `type(scope): description`
- Include tests for new features
- Update documentation when needed
- Keep commits atomic and focused

### Pull Request Process

1. Create a feature branch from `main`
2. Implement changes following coding standards
3. Add/update tests as needed
4. Ensure all checks pass:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```
5. Submit pull request with clear description

### Testing Requirements

- Unit tests for business logic
- Integration tests for API endpoints
- Component tests for React components
- Maintain >90% test coverage

### Architecture Guidelines

- Follow monorepo structure patterns
- Use shared types from `packages/shared`
- Implement proper error handling
- Document complex business logic

## Getting Help

- Check [Architecture Documentation](docs/architecture.md)
- Review existing code patterns
- Ask questions in pull request discussions
