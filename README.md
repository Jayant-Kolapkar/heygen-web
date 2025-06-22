This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, clone the repository and install dependencies:

```bash
git clone https://github.com/Jayant-Kolapkar/heygen-web.git
cd heygen-web
npm install
```

Then, create a `.env.local` file in the root of the project with the following values:

```
HEYGEN_API_KEY=your_heygen_api_key
NEXT_PUBLIC_AVATAR_ID=Brandon_Office_Sitting_Front_public
NEXT_PUBLIC_VOICE_ID=046dacc3502347eea0c796f97399632e
```

> 💡 If your API key ends with `==`, make sure to wrap it in quotes to avoid formatting issues.

Now, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

### Files Used

This project integrates a live Heygen avatar with streaming speech using Heygen's streaming API. These are the key files:

- **`components/AvatarStream.tsx`**  
  Initializes the `StreamingAvatar` instance, attaches the video stream, and handles the `speak()` calls and emotion config.

- **`app/api/streaming-session/route.ts`**  
  Main backend API route. It:
  - Creates a session token using your Heygen API key.
  - Initializes a streaming avatar session with emotion and voice config.
  - Starts the session and returns the connection data to the frontend.

- **`app/api/speak/route.ts`**  
  (Optional) Endpoint to handle text-to-speech requests dynamically if you want to build interactions later.

- **`app/api/token/route.ts`**  
  (Optional) Used for debugging token generation.

- **`app/api/verify-env/route.ts`**  
  Simple API to debug whether environment variables are correctly read on the server.

- **`lib/heygenTypes.ts`**  
  Shared enum/constants for Heygen emotion types.

- **`lib/cleanEnvVar.ts`**  
  Utility to sanitize any trailing quotes or spaces from environment variables.

- **`app/page.tsx`**  
  The root frontend page. It fetches a streaming session and renders the `AvatarStream` component.

---

## Common Issues

- **401 Unauthorized?**
  - Ensure `.env.local` has no trailing whitespace.
  - Wrap the API key in quotes if it ends with `=` or `==`.
  - Try regenerating your Heygen API key and restarting the dev server.

- **Streaming fails after connection?**
  - Confirm the selected voice supports emotion. You can use `SOOTHING`, `FRIENDLY`, or `NEUTRAL` depending on the voice capability.
  - Double-check that the avatar ID and voice ID are valid and compatible.

---

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
