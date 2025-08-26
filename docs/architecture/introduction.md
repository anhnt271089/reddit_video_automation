# Introduction

This document outlines the complete fullstack architecture for **video_automation**, a Reddit-to-Video Automation Workflow system that transforms Reddit posts into professionally produced videos. The architecture spans Reddit content discovery, AI-powered script generation via Claude, intelligent asset matching through Pexels, and automated video rendering using Remotion.

This unified approach combines frontend dashboard interfaces, backend processing pipelines, external API integrations, and video generation into a cohesive local-first development system. The architecture prioritizes developer experience, maintainability, and operational simplicity while delivering sophisticated automation capabilities.

## Starter Template or Existing Project

**Status:** Greenfield project with PRD-specified tech preferences

This project builds upon modern fullstack development principles using a monorepo approach with pnpm workspaces. The PRD explicitly specifies key technology choices: Node.js 20+, React 18, TypeScript 5+, Fastify, Vite, SQLite/PostgreSQL, and Remotion for video generation. No existing template is being extended - this is a custom architecture optimized for the specific Reddit-to-video automation workflow.

**Architectural constraints identified:**

- Local-first development prioritizing minimal external dependencies
- Single command setup requirement (npm install && npm start)
- Resource efficiency targeting 1GB RAM footprint
- <30 minute end-to-end processing time
- Desktop-first UI optimized for developer workflow

## Change Log

| Date       | Version | Description                            | Author              |
| ---------- | ------- | -------------------------------------- | ------------------- |
| 2025-08-25 | 1.0     | Initial architecture creation from PRD | Winston (Architect) |
