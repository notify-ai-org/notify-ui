# Channels portal

Available at `/portals/channels/` after building the portal assets and restarting
the access service. The portal uses the current login's tenant; it never accepts
a tenant ID override from the browser.

Run `npm install` and `npm run dev` in this directory for development. The Vite
server uses port 5184 and proxies `/api` to the access service on port 8080.
`npm run build` checks TypeScript and builds production assets.
After building `../shared`, run `npm test` for transport and Redux regression tests. From the repository
root, `bash notify-ui/build-all.sh channels` also copies them into the access
module. Rebuild all portals to refresh the shared sidebar everywhere.

The backend must have `notification.secrets.enabled=true`, its AWS Secrets
Manager configuration, and database migrations 002 through 005 applied. Log in with
`secret:metadata:read` to view channels and metrics, `secret:create` to provision
channels and credentials, and `secret:update` to change settings, replace
credentials, enable, or pause a channel. Rotation and revocation require
`secret:rotate` and `secret:delete` respectively.

The portal supports SMTP email, Twilio SMS, Meta WhatsApp, FCM push, webhooks,
and in-app channels. Each tenant can have one channel of each type, including
paused channels and those with revoked credentials. New-channel options exclude
existing types; a duplicate request returns a conflict and refreshes the list.
Creating a channel stores its provider settings first;
credential provisioning activates it. Later credential replacement or rotation
preserves a manually paused channel. Once revocation or failed-provisioning cleanup
reaches `DELETION_PENDING`, add credentials again on the same channel. The portal
uses POST to create a fresh secret and enable delivery; the retired secret's AWS
recovery window does not block this. `REVOKED` and `ROTATING` remain unavailable
while a lifecycle operation is pending.

Metrics count persisted delivery attempts for the last 1, 7, or 30 days.
“Accepted” means the connector's send request succeeded, not that the recipient
received or read the notification. Metrics exclude old attempts, other channels,
and logs whose tenant differs from the associated job. Buffered logs can appear
after a short delay.

All API calls use the shared `httpService` and its authentication interceptor.
The portal registers its Redux store using `createSharedStore`. Its channels slice
owns the channel list, tenant, selection, metrics, credential metadata, and request
status; temporary form and dialog state stays in React. Reads skip the shared
cache so channel permissions and lifecycle status are refreshed from the server.
Request IDs prevent stale responses from replacing the current selection's data.

Credential requests use the shared transport's `sensitive` option, which suppresses
payload logging and sanitizes server errors. Credentials pass through a closure
thunk, never Redux action payloads, state, or DevTools history. Form values are
cleared after submission; stored credential values are never requested or displayed.
Errors use the shared transport's `local` handling option and appear inline.
Credential mutations use a 60-second per-request timeout through the shared HTTP
service so sequential STS and Secrets Manager operations can complete. Other
requests retain the shared default timeout.

API additions:

- `GET /api/v1/channels`: list the authenticated tenant's channels.
- `PUT /api/v1/channels/{id}`: replace provider settings and update runtime fields.
- `PATCH /api/v1/channels/{id}/activation`: enable or pause using `{ "enabled": true }`.
- `GET /api/v1/channels/{id}/metrics?days=7`: aggregate persisted attempt metrics.

The credentials panel uses the existing credential create, replace, metadata,
rotate, and revoke endpoints. Enabling requires an active, matching credential
with no pending lifecycle operation. Pausing retains credentials.
