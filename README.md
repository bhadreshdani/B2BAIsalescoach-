# Bhadresh Dani — AI Sales Coach

AI-powered B2B sales coaching platform built on the "B2B Sales Transformation 2.0" methodology. Diagnoses real sales problems, provides contextual coaching with exact scripts, and tracks deal progress.

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 + Tailwind CSS | UI, SSR, API routes |
| Auth & Database | Supabase | User accounts, deals, sessions, feedback |
| AI Engine | Claude API (Anthropic) | Coaching generation, diagnosis |
| Knowledge Search | Pinecone | Vector search over uploaded methodology |
| Hosting | Vercel | Global deployment, edge functions |

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### 1. Clone and install

```bash
git clone <your-repo-url>
cd sales-coach
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your API keys (see "Setting Up Services" below).

### 3. Set up the database

Go to your Supabase project → SQL Editor → paste the contents of `supabase/migration.sql` → Run.

### 4. Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Setting Up Services

### Supabase (Auth + Database)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to **Settings → API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **SQL Editor** and run `supabase/migration.sql`
4. Go to **Authentication → Settings**:
   - Enable Email auth
   - Set Site URL to your domain (e.g., `https://yourdomain.com`)
   - Add redirect URLs: `https://yourdomain.com/auth/callback`

### Anthropic (Claude AI)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy to `ANTHROPIC_API_KEY` in `.env.local`
4. Add billing (usage-based, ~$0.003 per coaching session)

### Pinecone (Knowledge Base)

1. Go to [pinecone.io](https://pinecone.io) and create a free account
2. Create an index named `sales-coach-knowledge`:
   - Dimension: 1024
   - Metric: cosine
   - Cloud: AWS, Region: us-east-1
3. Copy API key to `PINECONE_API_KEY` in `.env.local`

---

## Deploying to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit — AI Sales Coach"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and import your GitHub repo
2. Add all environment variables from `.env.local` to the Vercel project settings
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
4. Deploy

### 3. Custom domain (optional)

1. In Vercel project settings → Domains → Add your domain
2. Update DNS records as instructed by Vercel
3. Update `NEXT_PUBLIC_APP_URL` and Supabase redirect URLs

---

## Project Structure

```
sales-coach/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles + Tailwind
│   ├── auth/
│   │   ├── login/page.tsx          # Login page
│   │   └── signup/page.tsx         # Signup with experience fields
│   ├── (dashboard)/
│   │   ├── deals/                  # Deals dashboard
│   │   │   ├── page.tsx            # All deals list
│   │   │   ├── [id]/page.tsx       # Deal detail + session history
│   │   │   └── new/page.tsx        # Create new deal
│   │   ├── coaching/
│   │   │   └── [dealId]/page.tsx   # Full coaching flow
│   │   ├── profile/page.tsx        # Profile settings
│   │   └── upgrade/page.tsx        # Upgrade to Pro
│   ├── admin/                      # Admin dashboard
│   │   ├── overview/page.tsx
│   │   ├── knowledge/page.tsx      # Upload & manage knowledge base
│   │   ├── feedback/page.tsx
│   │   ├── users/page.tsx
│   │   ├── test/page.tsx           # Test coaching quality
│   │   └── settings/page.tsx
│   └── api/
│       ├── coaching/route.ts       # AI coaching generation
│       ├── deals/route.ts          # Deal CRUD
│       ├── feedback/route.ts       # Feedback collection
│       └── knowledge/route.ts      # Document upload & processing
├── components/
│   ├── ui/                         # Reusable UI components
│   ├── coaching/                   # Coaching flow components
│   ├── admin/                      # Admin components
│   └── layout/                     # Layout components (header, sidebar)
├── lib/
│   ├── supabase.ts                 # Supabase client + types
│   ├── anthropic.ts                # Claude API + prompt engineering
│   ├── pinecone.ts                 # Vector search integration
│   ├── coaching-data.ts            # Challenge/situation configs
│   └── document-processor.ts       # PDF/DOCX chunking pipeline
├── supabase/
│   └── migration.sql               # Database schema
├── middleware.ts                    # Auth protection
├── .env.local.example              # Environment template
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## Uploading Your Knowledge Base

After deploying, go to the admin dashboard and upload your content:

1. **Your book** — "B2B Sales Transformation 2.0" (PDF)
2. **Sales playbook** — frameworks, processes (DOCX or PDF)
3. **Coaching scripts** — "what to say" templates (DOCX or TXT)
4. **Case studies** — real examples (DOCX or PDF)
5. **Objection handling guides** — situation-specific (DOCX or TXT)

The system will automatically:
- Extract text from each file
- Split into context-preserving chunks (~500-800 words each)
- Tag chunks by challenge (pricing/closing) and situation
- Generate vector embeddings for semantic search
- Make the content searchable for the AI coaching engine

---

## How the Coaching Engine Works

1. User selects a **challenge** (pricing pressure or closing deals)
2. AI asks 3 **diagnosis questions** to find the root cause
3. User sees **"Your perception vs AI diagnosis"** reveal
4. User selects their **specific situation** (e.g., "customer asking for discount")
5. User provides **reflection** (what they think is wrong, what they've tried)
6. System **searches Pinecone** for relevant knowledge base chunks
7. Claude AI generates **structured coaching** using:
   - User's profile (industry, products, competitors, experience)
   - Deal context (customer, industry for this deal)
   - Relevant methodology chunks from the knowledge base
   - Generational tone adaptation based on user's experience level
8. Coaching output includes: what's wrong → why → what to do → what to say → what to track

---

## Freemium Model

| | Free | Pro (₹2,999/month) |
|---|---|---|
| Coaching sessions | 3/month | Unlimited |
| Diagnosis engine | Yes | Yes |
| "What to say" scripts | Limited | Full |
| Deal history | Basic | Complete |
| Follow-up coaching | — | Yes |
| Priority support | — | Yes |

Session limits reset on the 1st of each month (via Supabase cron function).

---

## Admin Dashboard

Access at `/admin` (requires admin role in the database).

- **Overview** — user count, sessions, ratings, challenge breakdown
- **Knowledge base** — upload, manage, delete documents
- **Feedback** — all user ratings and comments
- **Users** — user list, plans, session counts
- **Test coaching** — test AI responses against your knowledge base
- **Settings** — freemium limits, coaching tone, API status

To make yourself admin, run in Supabase SQL Editor:
```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your-email@domain.com';
```

---

## Monthly Maintenance

- **Session reset**: Free user session counts reset monthly. Set up a Supabase cron job:
  ```sql
  SELECT cron.schedule('reset-sessions', '0 0 1 * *', 'SELECT public.reset_monthly_sessions()');
  ```
- **Knowledge base updates**: Upload new content anytime via admin dashboard
- **Monitor costs**: Check Anthropic usage dashboard monthly (~$0.003/session)

---

## Phase 2 Roadmap

- [ ] 3 more challenges (long sales cycle, proposal conversion, competition)
- [ ] Deal intelligence (stakeholder mapping, DISC profiling)
- [ ] Progress dashboard with metrics
- [ ] Deal summary PDF download
- [ ] Cross-deal memory (refer back by deal ID)
- [ ] Stripe payment integration
- [ ] Sales manager team dashboard
- [ ] AI learning from feedback loop

## Phase 3 Roadmap

- [ ] Voice-based interaction (mobile app)
- [ ] Multi-language support
- [ ] CRM integration (Salesforce, HubSpot)
- [ ] Real-time call coaching integration

---

## Support

For questions about the codebase, deployment, or customisation, refer to the Project Status Summary document for full context on all decisions made during development.

Built with the Bhadresh Dani brand guidelines: Command Navy (#1B2A4A), Ambition Gold (#C8943E), DM Serif Display + DM Sans typography.
