# bookingRooms

An independent, full-stack, multi-tenant hotel management
and online reservation platform.

## Technology Stack

- Next.js
- TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- Docker

## Project Structure

- apps/web: Next.js frontend
- apps/api: NestJS backend
- apps/worker: Background processing
- infrastructure: Deployment configuration
- docs: Project documentation

## Local Development

### Start infrastructure

docker compose up -d

### Start backend

cd apps/api
npm run start:dev

### Start frontend

cd apps/web
npm run dev -- --port 3001

## Local URLs

- Frontend: http://localhost:3001
- Backend: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Project Status

Phase 1: Repository foundation and local environment.