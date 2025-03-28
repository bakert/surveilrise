# Surveilrise

A Scryfall clone.

# Requirements

- [Node.js 18+](https://nodejs.org/en)
- [pnpm 8+](https://pnpm.io/)
- [Docker](https://www.docker.com/)
- [Turbo](https://turbo.build/repo/docs/installing)

# Live Version

- [surveilrise.bluebones.net](https://surveilrise.bluebones.net/)

# Getting Started

- `git clone https://github.com/bakert/surveilrise.git`
- `cd surveilrise`
- `pnpm install`
- `cp packages/env/.env.example packages/env/.env && ./dev-bootstrap.sh` to set up the environment variables
- `docker-compose up -d` to run the Postgres database
- `pnpm --filter database db:migrate:reset` to initialize the db schema. You only need to do this once.
- `pnpm build`
- `pnpm --filter scryfall exec ts-node src/import.ts` to download Scryfall data and populate the database. You can run this again any time to update to latest Scryfall data.
- `pnpm dev` to start the webserver (and live reload any changes).
- Open http://localhost:3000 in your browser.
- Try "-f:pioneer c:u cmc=1 t:instant o:draw" as a search, maybe.

# Useful Scripts

Run tests by package:

- `pnpm --filter search test`
- `pnpm --filter database test`

Quickly test the Scryfall import without actually reimporting every card:

- `pnpm -r --filter database exec tsx src/reset-scryfall.ts`
- `pnpm --filter scryfall exec ts-node src/import.ts --quick`

Clear all card data without blowing away the database:

- `pnpm -r --filter database exec tsx src/reset-scryfall.ts --clear-all`

Completely start from scratch with the database:

- `pnpm --filter database db:migrate:reset --force`

## What's inside?

This Turborepo includes the following packages/apps:

### Apps and Packages

- `web`: a [Next.js 13 (App Router)](https://nextjs.org/) app with [Tailwind CSS](https://tailwindcss.com/) and Prisma.
- `ui`: a React component library with [Tailwind CSS](https://tailwindcss.com/)
- `eslint-config-custom`: `eslint` configurations (includes `eslint-config-next` and `eslint-config-prettier`).
- `tsconfig`: `tsconfig.json`s used throughout the monorepo.
- `database`: the schema and client of Prisma.
- `env`: the typed safe environment variables used throught the monorepo using [t3-env](https://github.com/t3-oss/t3-env).

Notes:

- Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).
- Every component in the `ui` package is a [Client component](https://nextjs.org/docs/getting-started/react-essentials#client-components). The `"use client"` directive is added automatically by `packages/ui/scripts/post-build.sh` script. Adding `"use client"` directive in the component files do nothing because [tsup/esbuild strip the off](https://github.com/egoist/tsup/issues/835#issuecomment-1481150839).
- The live version of `web` app can be found at [https://turbo-next-prisma-tailwind-web.vercel.app/](https://turbo-next-prisma-tailwind-web.vercel.app/).

### Utilities

This Turborepo has some additional tools:

- [Tailwind CSS](https://tailwindcss.com/) for styles
- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Prisma](https://www.prisma.io/) for database ORM

### Environment Variables

During development, this monorepo uses single environment variable file located in `packages/env/.env`. When you execute the `./dev-bootstrap` script, it creates symlink for the `.env` file into the other apps and packages. You can then read the environment variables by importing the `env` package.

```typescript
import { env } from "env";

console.log(env.HELLO_WORLD);
console.log(env.NEXT_PUBLIC_HELLO_WORLD);
```

The `env` package exports a type-safe environment variables using [t3-env](https://github.com/t3-oss/t3-env) and [zod](https://zod.dev/).

Notes:

- Don't read the environment variables directly from `process.env`.
- Only edit the `packages/env/.env` file if you want to add, edit, or remove environment variables. Keep the `packages/env/.env` as the single source
- Use `env.NEXT_PUBLIC_<name>` if you want to read the variable from a Client component. If you read a `env.<name>` variable from a Client component, you'll get error.
- If you make changes to server environment variables or the client environment variables, you need to edit the `packages/env/src/index.ts` file too.

## How to

- Add new workspace: `turbo gen workspace`
- Copy a workspace: `turbo gen workspace --copy`
- Add npm package to a workspace: `pnpm add <package_name> --filter workspace`

## Troubleshoting

- VSCode shows error: `Cannot find module 'ui' or its corresponding type declarations.ts(2307)` or for any modules, restart the TS Server: Press Cmd+P then type `restart ts`, then Enter to restart the typescript server.

# API Documentation

The API documentation is available at `/api/docs` when running the development server. It provides detailed information about:

- Search API (`/api/search`) - Search for Magic: The Gathering cards using various criteria
- Card Details API (`/api/cards/{id}`) - Get detailed information about a specific card

The documentation includes:

- Request/response formats
- Query parameters
- Response codes
- Example requests and responses

The OpenAPI specification is available at `/api/openapi`.
