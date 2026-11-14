# Staff authentication

The Keycloak sign-in page is `/staff/session`. The existing demo login is separate from staff API authentication.

## Configure Keycloak

1. Create an OpenID Connect client with client authentication and Standard Flow enabled. Require PKCE S256 and RS256 signatures. Disable Direct Access Grants and service accounts for this staff client.
2. Register the exact callback URL, such as `http://127.0.0.1:3000/api/v1/auth/callback`. Use HTTPS for deployed applications.
3. Configure a browser authentication flow that requires MFA at the selected assurance level. Set the client's minimum ACR to that value and ensure Keycloak includes the `acr` claim in both token types. For Bearer API access, add the staff client ID to the access-token audience and set the token lifespan to 15 minutes or less.
4. Provision each staff account with its Keycloak issuer and subject and an active membership in the configured property. Assign the app role in the staff account. API handlers use the application role and membership from PostgreSQL.

See the [Keycloak administration guide](https://www.keycloak.org/docs/latest/server_admin/) for browser flows, ACR mapping and audience mappers.

## Run locally

1. Set the six `STAFF_OIDC_*` and `STAFF_AUTH_*` settings shown in `.env.example` in `.env.local`. Set `STAFF_AUTH_ORIGIN` to the exact origin you open in the browser and `STAFF_AUTH_PROPERTY_ID` to the property's database ID. Keep the client secret server-side.
2. Export the `dev-chinu` connection as `DATABASE_URL` before running `npm run db:migrate` from `public-preview`. The migration adds the `staff_session` table.
3. Start the app and open `/staff/session`. Sign in with a provisioned Keycloak staff account and complete MFA. Check the session panel, then sign out.
4. Run `npm run test:staff-auth` to test the OIDC exchange and JWT checks against a temporary loopback provider. This command needs no Keycloak credentials.

## API

| Endpoint | Behavior |
| --- | --- |
| `GET /api/v1/auth/login` | Starts Authorization Code with PKCE, state and nonce |
| `GET /api/v1/auth/callback` | Validates the ID token and issues the session cookies |
| `GET /api/v1/auth/session` | Returns the active staff identity |
| `POST /api/v1/auth/refresh` | Rotates the access, refresh and CSRF credentials |
| `POST /api/v1/auth/logout` | Revokes the app session and clears its cookies |

Browser mutations send the value of `grand_csrf_token` in `X-CSRF-Token`. Browser access lasts 15 minutes and refresh rotates within an eight-hour sliding window. Refresh credentials are scoped to auth endpoints, and PostgreSQL stores credential hashes. Logout revokes the application session. Keycloak single sign-on and its independently issued API tokens have their own lifecycle.
