#!/usr/bin/env node

/**
 * Health Check System
 * Validates entire system setup for development workflow
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';

const REQUIRED_NODE_VERSION = '20.0.0';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

class HealthChecker {
  constructor() {
    this.checks = [];
    this.failed = [];
    this.warnings = [];
  }

  log(message, color = RESET) {
    console.log(`${color}${message}${RESET}`);
  }

  success(message) {
    this.log(`✅ ${message}`, GREEN);
  }

  error(message) {
    this.log(`❌ ${message}`, RED);
    this.failed.push(message);
  }

  warning(message) {
    this.log(`⚠️  ${message}`, YELLOW);
    this.warnings.push(message);
  }

  info(message) {
    this.log(`ℹ️  ${message}`, BLUE);
  }

  async checkNodeVersion() {
    try {
      const version = process.version.slice(1); // Remove 'v' prefix
      const [major] = version.split('.').map(Number);
      const [requiredMajor] = REQUIRED_NODE_VERSION.split('.').map(Number);

      if (major >= requiredMajor) {
        this.success(
          `Node.js version: ${version} (>= ${REQUIRED_NODE_VERSION})`
        );
        return true;
      } else {
        this.error(
          `Node.js version: ${version} (requires >= ${REQUIRED_NODE_VERSION})`
        );
        return false;
      }
    } catch (error) {
      this.error(`Failed to check Node.js version: ${error.message}`);
      return false;
    }
  }

  async checkPnpmInstallation() {
    try {
      const version = execSync('pnpm --version', { encoding: 'utf8' }).trim();
      this.success(`pnpm version: ${version}`);
      return true;
    } catch (error) {
      this.error('pnpm is not installed or not in PATH');
      this.info('Install pnpm: npm install -g pnpm');
      return false;
    }
  }

  async checkDependenciesInstalled() {
    try {
      const nodeModulesExists = existsSync('./node_modules');
      if (!nodeModulesExists) {
        this.error('Dependencies not installed (no node_modules found)');
        this.info('Run: pnpm install');
        return false;
      }

      // Check workspace dependencies
      const workspaces = [
        './apps/web/node_modules',
        './apps/server/node_modules',
        './packages/shared/node_modules',
      ];

      let allInstalled = true;
      for (const workspace of workspaces) {
        if (!existsSync(workspace)) {
          this.warning(`Workspace dependencies missing: ${workspace}`);
          allInstalled = false;
        }
      }

      if (allInstalled) {
        this.success('All workspace dependencies installed');
      } else {
        this.info('Run: pnpm install to install workspace dependencies');
      }

      return nodeModulesExists;
    } catch (error) {
      this.error(`Failed to check dependencies: ${error.message}`);
      return false;
    }
  }

  async checkDatabaseConnection() {
    try {
      // Check if database file exists
      const dbPath = './apps/server/data/video_automation.db';
      if (existsSync(dbPath)) {
        this.success('Database file exists');
        return true;
      } else {
        this.warning(
          'Database file not found - will be created on first server start'
        );
        return true; // This is not a critical failure
      }
    } catch (error) {
      this.error(`Failed to check database: ${error.message}`);
      return false;
    }
  }

  async checkTypeScriptCompilation() {
    try {
      // Check shared types package
      this.info('Checking TypeScript compilation...');
      execSync('pnpm --filter=@video-automation/shared-types run typecheck', {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      // Check server package
      execSync('pnpm --filter=server run typecheck', {
        stdio: 'pipe',
        encoding: 'utf8',
      });

      this.success('TypeScript compilation successful');
      return true;
    } catch (error) {
      this.error('TypeScript compilation failed');
      this.info('Run: pnpm typecheck for details');
      return false;
    }
  }

  async checkFrontendBuild() {
    try {
      this.info('Checking frontend build...');
      execSync('pnpm --filter=video-automation-web run build', {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      this.success('Frontend build successful');
      return true;
    } catch (error) {
      this.error('Frontend build failed');
      this.info(
        'Run: pnpm --filter=video-automation-web run build for details'
      );
      return false;
    }
  }

  async checkBackendStart() {
    try {
      this.info('Checking backend compilation...');
      execSync('pnpm --filter=server run build', {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      this.success('Backend compilation successful');
      return true;
    } catch (error) {
      this.error('Backend compilation failed');
      this.info('Run: pnpm --filter=server run build for details');
      return false;
    }
  }

  async checkLinting() {
    try {
      this.info('Checking code linting...');
      execSync('pnpm lint', {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      this.success('Linting passed');
      return true;
    } catch (error) {
      this.error('Linting failed');
      this.info('Run: pnpm lint for details');
      return false;
    }
  }

  async checkGitHooks() {
    try {
      if (existsSync('./.husky/pre-commit')) {
        this.success('Git hooks configured (Husky)');
        return true;
      } else {
        this.warning('Git hooks not found');
        this.info('Run: npx husky install');
        return false;
      }
    } catch (error) {
      this.error(`Failed to check git hooks: ${error.message}`);
      return false;
    }
  }

  async checkConfigFiles() {
    const requiredFiles = [
      { path: './tsconfig.json', name: 'Root TypeScript config' },
      { path: './turbo.json', name: 'Turbo config' },
      { path: './.eslintrc.cjs', name: 'ESLint config' },
      { path: './.prettierrc', name: 'Prettier config' },
      { path: './pnpm-workspace.yaml', name: 'pnpm workspace config' },
    ];

    let allPresent = true;
    for (const file of requiredFiles) {
      if (existsSync(file.path)) {
        this.success(`${file.name} found`);
      } else {
        this.error(`${file.name} missing: ${file.path}`);
        allPresent = false;
      }
    }

    return allPresent;
  }

  async runAllChecks() {
    this.log('\n🔍 Running System Health Check...\n', BLUE);

    const checks = [
      { name: 'Node.js Version', fn: () => this.checkNodeVersion() },
      { name: 'pnpm Installation', fn: () => this.checkPnpmInstallation() },
      { name: 'Dependencies', fn: () => this.checkDependenciesInstalled() },
      { name: 'Config Files', fn: () => this.checkConfigFiles() },
      { name: 'Database', fn: () => this.checkDatabaseConnection() },
      { name: 'TypeScript', fn: () => this.checkTypeScriptCompilation() },
      { name: 'Frontend Build', fn: () => this.checkFrontendBuild() },
      { name: 'Backend Build', fn: () => this.checkBackendStart() },
      { name: 'Linting', fn: () => this.checkLinting() },
      { name: 'Git Hooks', fn: () => this.checkGitHooks() },
    ];

    for (const check of checks) {
      this.log(`\n📋 ${check.name}`, YELLOW);
      try {
        await check.fn();
      } catch (error) {
        this.error(`${check.name} check failed: ${error.message}`);
      }
    }

    this.printSummary();
  }

  printSummary() {
    this.log('\n📊 Health Check Summary', BLUE);
    this.log('='.repeat(50));

    if (this.failed.length === 0 && this.warnings.length === 0) {
      this.success(
        '🎉 All checks passed! System is healthy and ready for development.'
      );
    } else {
      if (this.failed.length > 0) {
        this.log(`\n❌ ${this.failed.length} Critical Issues:`, RED);
        this.failed.forEach(issue => this.log(`   • ${issue}`, RED));
      }

      if (this.warnings.length > 0) {
        this.log(`\n⚠️  ${this.warnings.length} Warnings:`, YELLOW);
        this.warnings.forEach(warning => this.log(`   • ${warning}`, YELLOW));
      }

      if (this.failed.length > 0) {
        this.log('\n🔧 Fix critical issues before development', RED);
        process.exit(1);
      } else {
        this.log('\n✅ System ready with minor warnings', YELLOW);
      }
    }

    this.log('\n🚀 Quick Start Commands:', BLUE);
    this.log('   • pnpm dev          - Start all services');
    this.log('   • pnpm dev:web      - Start frontend only');
    this.log('   • pnpm dev:server   - Start backend only');
    this.log('   • pnpm build        - Build all packages');
    this.log('   • pnpm test         - Run all tests');
    this.log('   • pnpm lint         - Check code style');
    this.log('   • pnpm format       - Format code');
  }
}

// Run health check
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new HealthChecker();
  checker.runAllChecks().catch(error => {
    console.error('Health check failed:', error);
    process.exit(1);
  });
}
