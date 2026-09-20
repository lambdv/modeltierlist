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
bunx convex env set SITE_URL http://localhost:4000
bunx convex env set BETTER_AUTH_SECRET your-secret
bunx convex env set GITHUB_CLIENT_ID your-client-id
bunx convex env set GITHUB_CLIENT_SECRET your-client-secret
```

For local development, the GitHub OAuth app callback URL is:

```text
http://localhost:4000/api/auth/callback/github
```

For production, set `SITE_URL` on the production Convex deployment to the
deployed app origin:

```bash
bunx convex env set SITE_URL https://modeltierlist.vercel.app --prod
```

The production GitHub OAuth callback must use the deployed app origin:

```text
https://modeltierlist.vercel.app/api/auth/callback/github
```

Set `SITE_URL` on whichever Convex deployment the Vercel app uses. Normally
that should be the production deployment; this project currently points Vercel
at the development deployment, so that deployment needs the production URL too.
