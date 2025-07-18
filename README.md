# HeyGen‑Web

**Interactive AI Avatar Web App**

This Next.js application lets you chat with a HeyGen avatar in two modes:

* **Text Mode** (`components/AvatarStream.tsx`) — Type messages and receive avatar replies in the browser.
* **Voice Mode** (`components/AvatarVoice.tsx`) — Speak to the avatar over your microphone; see and hear real‑time responses and transcripts.

The avatar is an investor assistant from Ideasouq, asking follow‑up questions about a startup’s pitch deck and online profile. You can customize its personality and behavior by editing the system prompt in `components/AvatarVoice.tsx`.

---

## 📁 Project Structure

```
heygen-web/
├── .env.local                # Environment variables (ignored by Git)
├── app/
│   ├── api/get-access-token/ # Route to fetch HeyGen API token
│   │   └── route.ts
│   ├── layout.tsx
│   └── page.tsx               # Mode switch: Text vs. Voice
├── components/
│   ├── AvatarStream.tsx       # Text‑only chat UI
│   └── AvatarVoice.tsx        # Video + voice chat UI
├── lib/
│   ├── cleanEnvVar.ts         # Env var helper
│   └── heygenTypes.ts         # Type definitions
├── public/
│   └── knowledge/summary.txt  # Pre‑generated startup summary
├── package.json
└── next.config.js
```

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** v18+ (or latest LTS)
* **npm** v8+ (bundled with Node)
* A HeyGen API key (found under **Settings → Subscriptions → API** in your HeyGen dashboard)

### Environment Variables

Create a file at the project root named `.env.local` with these entries:

```bash
HEYGEN_API_KEY=your_heygen_api_key          # copy/paste exactly, may include ==
NEXT_PUBLIC_AVATAR_ID=Brandon_Office_Sitting_Front_public
NEXT_PUBLIC_VOICE_ID=046dacc3502347eea0c796f97399632e
PORT=3000
```

> **Note:** VSCode may color the `==` differently, but as long as they’re in `.env.local` without quotes, it works.

### Install & Run

```bash
# Install dependencies
pm install

# Run development server
npm run dev

# Open your browser
http://localhost:3000
```

---

## ⚙️ Available Scripts

```bash
npm run dev    # Start development server (port 3000)
npm run build  # Build for production
npm run start  # Start built app
npm run lint   # Run Next.js linter
npm run clean  # Remove node_modules & lockfile
```

---

## 🧩 Customizing the Avatar

Open `components/AvatarVoice.tsx` and locate the **`knowledgeBase`** string. You can:

* Change the avatar’s introduction or persona.
* Update the number or type of questions it should ask.
* Modify the session end phrase (default: **"Session complete"**).

  * If you change it, also update the detection logic in the `AVATAR_END_MESSAGE` handler.

```ts
// Example:
const knowledgeBase = `...\nWhen you are finished saying all your questions, end with:\n"Thank you for your time. This concludes our conversation. Session complete."`;
```
---
## 🛠 Installation and Running Locally

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Jayant-Kolapkar/heygen-web.git
   cd heygen-web
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Create a `.env.local` file in the root of the project and add:

   ```
   HEYGEN_API_KEY=your_heygen_api_key
   NEXT_PUBLIC_AVATAR_ID=Brandon_Office_Sitting_Front_public
   NEXT_PUBLIC_VOICE_ID=046dacc3502347eea0c796f97399632e
   PORT=3000
   ```

   > 💡 You can find your HeyGen API key in the HeyGen dashboard under **Settings → Subscriptions and API**. It often ends in `==`. Do not wrap it in quotes.

4. **Start the development server:**

   ```bash
   npm run dev
   ```

5. **Visit the app:**

   Open your browser and go to:

   ```
   http://localhost:3000
   ```

---

## 📦 Deployment (Vercel)

1. Push your repo to GitHub.
2. Login to Vercel and import the GitHub project.
3. In Vercel dashboard, add the same environment variables (HEYGEN\_API\_KEY, etc.).
4. Click **Deploy**. Vercel will run `npm run build` and host your app.

---

## 📄 Transcript Download

When the avatar says the session‑end phrase, the UI shows a **Download Transcript** button. It exports a JSON file with question/answer pairs:

```json
[
  { "id": 1, "question": "What is your revenue model?", "answer": "We use a subscription service..." },
  { "id": 2, "question": "How many active users?", "answer": "About 10,000 per month." },
  …
]
```



