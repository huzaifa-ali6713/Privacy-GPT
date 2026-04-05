# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (`gpt-5.2`)

## Artifacts

- **chatbot** (`artifacts/chatbot/`) — Nova AI chatbot frontend (React + Vite, at `/`)
- **api-server** (`artifacts/api-server/`) — Express API server (at `/api`)

## Features

- ChatGPT-like AI chatbot interface powered by OpenAI gpt-5.2
- Premium animated background with glowing CSS blobs
- Dark glassmorphism UI theme (deep purple/navy)
- Conversation history with sidebar (persisted in PostgreSQL)
- Streaming AI responses via SSE
- Markdown rendering for AI messages
- Fresh interface for each new chat session

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `conversations` — chat conversation records (id, title, createdAt)
- `messages` — chat messages (id, conversationId, role, content, createdAt)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
