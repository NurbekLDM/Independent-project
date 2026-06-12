# Uzbek Text Normalizer

Web service for automatic cleaning and normalization of Uzbek text collected from social media platforms.

## Problem

Social media text contains slang, abbreviations, misspellings, repeated characters, emoji noise, and mixed-language fragments. This makes it hard to analyze, search, or feed into downstream NLP pipelines.

## Research Question

How can automatic text cleaning and normalization improve the quality of Uzbek social media text for downstream NLP tasks?

## MVP

- Login and register
- Paste or upload Uzbek text
- Automatic cleaning and normalization
- Save processed texts
- Rate result quality

## Stack

- Frontend: Next.js App Router
- Backend: Next.js route handlers
- Database: PostgreSQL
- ORM: Prisma
- Containerization: Docker and Docker Compose
- Tests: Vitest

## Run

1. Copy `.env.example` to `.env`.
2. Start containers:

```bash
docker compose up --build
```

3. Run migration:

```bash
npx prisma migrate dev --name init
```

4. Open `http://localhost:3000`.
