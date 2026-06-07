# Server-To-Client Security

Client code is public. Anything sent to a browser, mobile app, desktop app, or
static bundle can be copied by the user. VibeGuard treats server-to-client work
as a security boundary decision, not a simple refactor.

## Boundary Rule

Keep these values server-side only:

- provider API keys such as OpenAI, Anthropic, Stripe, AWS, Twilio, SendGrid, or
  Resend secrets
- database URLs and direct database credentials
- service-role keys, admin tokens, and privileged SDK credentials
- private keys, signing secrets, JWT secrets, session secrets, and cookie secrets
- webhook signing secrets and payment processing secrets

Only expose client values that are intentionally public, narrowly scoped, and
safe if copied. Examples include publishable payment keys, public project IDs,
or anon keys that are protected by row-level security, rate limits, and server
policies.

## Agent Workflow

When an AI agent moves logic between server and client code:

1. Classify every env variable as `server-secret`, `client-public`, or
   `unknown`.
2. Treat `unknown` as `server-secret` until the user or project docs prove it is
   safe to expose.
3. Replace direct client calls to secret-bearing providers with a server
   endpoint.
4. Validate user identity and authorization on the server endpoint.
5. Add rate limits or quota controls before connecting the endpoint to paid
   services.
6. Return only the minimum data the client needs.
7. Keep environment-specific URLs, API origins, redirect/callback URLs, and
   asset hosts in platform config when they differ between development, staging,
   and production; do not hard-code those values in source.
8. Keep env templates such as `.env.example` and `.env.sample` value-free and
   document only variable names or placeholders.

## Framework Notes

- `NEXT_PUBLIC_`, `VITE_`, and similar prefixes usually expose values to the
  client bundle. Do not use those prefixes for secrets.
- Server components, API routes, server actions, functions, and backend services
  may read secrets when they do not serialize those values to the client.
- Build-time variables can still end up in static assets. Confirm the framework
  exposure rules before moving an env read.

## Stop Conditions

Stop and ask for approval before:

- moving a secret-bearing call from server code to client code,
- adding a public env prefix to an existing variable,
- exposing a database identifier that can bypass backend authorization,
- returning provider responses that may include tokens, internal IDs, billing
  data, or private user data,
- changing auth, session, cookie, CORS, CSP, payment, or webhook behavior.
