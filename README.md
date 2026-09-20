# Next.js + Better Auth + Convex

GitHub sign-in is handled by Better Auth and persisted in Convex.

## Run locally

```bash
bun install
bunx convex dev
bun dev
```

Set these variables on the Convex deployment (values are already present in the
local `.env.local` copied from the sibling `rank` project):

```bash
bunx convex env set SITE_URL http://localhost:3000
bunx convex env set BETTER_AUTH_SECRET your-secret
bunx convex env set GITHUB_CLIENT_ID your-client-id
bunx convex env set GITHUB_CLIENT_SECRET your-client-secret
```

For local development, the GitHub OAuth app callback URL is:

```text
http://localhost:3000/api/auth/callback/github
```

Use the deployed app origin in both `SITE_URL` and the callback URL for
production.
