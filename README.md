# SheRides

## MongoDB-backed accounts

Each rider or captain has a separate MongoDB account. Passwords are stored as bcrypt hashes; account data is read and written only after the API verifies the account's short-lived access token. The browser's old shared demo profile/history is not imported into MongoDB.

### Local development

1. Create a MongoDB database (MongoDB Atlas or a local MongoDB server). Keep its connection string private.
2. Create the root `.env` file and set `MONGODB_URI`, a random `JWT_SECRET` (at least 32 characters), and a private `DOCUMENT_ENCRYPTION_KEY`. For a local MongoDB server, use `mongodb://127.0.0.1:27017/sherides`; for Atlas, use the connection string from your cluster. Never commit `.env` or put secrets in `VITE_*` variables.
3. If using Atlas, create a database user and allow the IP address of the machine running the API in the Atlas network access settings.
4. Open two terminals in the project folder:

   ```powershell
   npm run dev:api
   ```

   ```powershell
   npm run dev
   ```

   The Vite development server forwards `/api` requests to `http://127.0.0.1:3000`.
5. Visit `http://localhost:5173` and check that the API health endpoint reports a connected database at `http://localhost:3000/api/health`.

### Map tiles

The interactive map works with OpenStreetMap tiles without an API key. To use the Mapbox dark map style, create a Mapbox public access token (`pk...`) and put it in a root-level `.env.local` file:

```dotenv
VITE_MAPBOX_TOKEN=pk.your_public_mapbox_token
```

Restart `npm run dev` after adding or changing the token. `.env.local` is ignored by Git; do not commit the token. A Mapbox token only loads map tiles and does not provide live driver locations or dispatch. Riders can use browser GPS for their pickup; the captain GPS marker stays on that captain's device until a live location-sharing backend is configured.

Generate both server secrets with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Use the first value for `JWT_SECRET` and the second for `DOCUMENT_ENCRYPTION_KEY`. Keep the encryption key private and backed up: encrypted captain documents cannot be recovered without it.

### Captain applications

Captain signup collects contact and vehicle details, CNIC front/back, driving license, and both sides of the vehicle registration. Each file must be JPG, PNG, or PDF and at most 3 MB. If the vehicle is not registered to the captain, the form also asks for the owner's name and an authorization letter. Files are encrypted with AES-256-GCM before being stored in a separate MongoDB collection; the app never returns document bytes to another account.

Registration ownership is self-reported, not automatically verified against government records. Applications remain under review, and the demo does not provide an authorized reviewer portal, live dispatch, or payment/payout integration. Riders can use browser GPS to set their pickup point. When an approved captain goes online, the captain dashboard can show that device's live GPS position after browser location permission is granted; it is not broadcast to riders or used to dispatch real trips. Nearby driver markers and ride matching remain demo data. Do not use real identity documents in a public demo until a properly authorized review process, retention policy, and production security controls are in place.

Rider wallets support demo top-ups using Bank, Easypaisa, or JazzCash selections. A top-up must be at least Rs 500, and a ride is debited from the wallet before matching; a cancelled ride is refunded. Captains also have a separate Money page showing completed demo-ride earnings and a separate ledger of demo deposits recorded for SheRides. These payment controls only simulate activity and do not move money; live collection or payouts require a configured payment provider. Profile photos are resized in the browser before being stored with that account.

During local development only, the login form shows demo accounts:

- Rider: `rider.demo@sherides.local` / `SheRidesDemo2026!`
- Captain: `captain.demo@sherides.local` / `CaptainDemo2026!`

The API seeds these accounts only when `NODE_ENV` is not `production`. Set `NODE_ENV=production` on every deployed API.

### Deployment

Deploy `server/` as a Node.js service with the repository root as its working directory and `npm run server` as its start command. Set `NODE_ENV=production`; configure `MONGODB_URI`, `JWT_SECRET`, `DOCUMENT_ENCRYPTION_KEY`, `APP_ORIGINS` (the exact HTTPS website origin), and `PORT` as private server environment variables.

Build the frontend with `npm run build`. When its hosting platform builds the site, set `VITE_API_URL` to the HTTPS origin of the API service (without a trailing slash). Keep the API's allowed origins in `APP_ORIGINS` aligned with the website domain. Do not expose the MongoDB URI or JWT secret to the browser.

Auth tokens are held in browser session storage and expire after one hour. Use HTTPS in production. For production launch, use a managed secret store, configure MongoDB network access narrowly, and consider moving to secure, HTTP-only cookies and a reviewed session/refresh-token design.

## Current data scope

Profiles, contacts, captain application details, encrypted captain identity/vehicle documents, ride history, SOS events, safety preferences, and notifications are scoped to each account. Nearby drivers and ride matching remain demo data, not a live dispatch service.
