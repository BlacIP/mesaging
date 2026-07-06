# Sweet Messages

A small Vercel + Neon app for managing good-morning and good-night messages, with an API endpoint that iPhone Shortcuts can call.

## Environment Variables

Set these locally in `.env.local` and in Vercel:

```bash
DATABASE_URL="postgresql://..."
```

Authentication is intentionally left out for the first version. Add token or login protection before sharing the app URL widely.

## Local Setup

```bash
npm install
npm run db:init
npm run db:seed
npm run dev
```

Open `http://localhost:3000`, then manage the message bank.

## iPhone Shortcut Endpoint

Morning:

```text
https://YOUR-APP.vercel.app/api/next?period=morning
```

Night:

```text
https://YOUR-APP.vercel.app/api/next?period=night
```

The response is JSON:

```json
{
  "id": 1,
  "period": "morning",
  "message": "Good morning, My Love..."
}
```

In Shortcuts:

1. Create a time-based personal automation.
2. Add "Get Contents of URL" using the endpoint above.
3. Get Dictionary Value: `message`.
4. Send Message to your wife through Messages.
5. Optionally add the WhatsApp Shortcut action after that.

## Deploy

1. Push this repo to GitHub.
2. Create/import the project in Vercel.
3. Add Neon from the Vercel Marketplace, or create a Neon database manually.
4. Set `DATABASE_URL` in Vercel.
5. Deploy.
6. Run the seed script locally against the Neon `DATABASE_URL`, or add messages in the admin page.
