# RYVYNN

**Privacy-First Mental Wellness Companion**

RYVYNN is a web application that provides straightforward mental wellness support through "The Flame" - an AI-powered companion that offers clear, actionable guidance without clinical jargon.

🔥 **Live Demo**: [Coming Soon]

---

## Key Features

### 🔒 Privacy-First Architecture
- **Client-side encryption** for journal entries using AES-GCM-256
- **Minimal data retention** - only encrypted ciphertext stored
- **No surveillance or ad tracking**
- **User-controlled data** with export functionality

### 💬 The Flame
- Clear, simple guidance (4th-5th grade reading level)
- Actionable next steps and coping tools
- Crisis-aware safety routing
- Non-clinical peer support tone

### 📝 Encrypted Journaling
- Password-protected local encryption
- Export your journal anytime
- Completely private - we can't read your entries

### 🛡️ Crisis Safety
- Automatic detection of self-harm signals
- Immediate crisis resources (988 Lifeline, etc.)
- Safety-first approach without storing triggering content

### 💳 Subscription Management
- Free tier: 5 Flame conversations/day
- Premium tier: 100 conversations/day + enhanced features
- Stripe-powered billing with customer portal

### 📊 Admin Dashboard
- User metrics and analytics
- Crisis event monitoring (anonymized)
- Revenue tracking

---

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js Server Actions, API Routes
- **Database**: Supabase (Postgres + RLS)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (Checkout + Customer Portal)
- **Encryption**: Web Crypto API (AES-GCM)
- **Deployment**: Vercel
- **AI**: Deterministic rule-based engine (no external API required)

---

## Project Structure

```
ryvynn/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Landing page
│   ├── login/               # Authentication pages
│   ├── signup/
│   ├── app/                 # Main application
│   │   ├── page.tsx         # The Flame interface
│   │   ├── journal/         # Encrypted journal
│   │   └── settings/        # Account & subscription
│   ├── admin/               # Admin dashboard
│   └── api/                 # API routes
│       └── webhooks/stripe/ # Stripe webhook handler
├── lib/                     # Shared utilities
│   ├── supabase/           # Supabase clients & middleware
│   ├── stripe/             # Stripe client & actions
│   ├── crypto/             # Encryption utilities
│   ├── flame/              # The Flame response engine
│   └── actions/            # Server actions
├── supabase/               # Database migrations & config
│   └── migrations/
├── types/                  # TypeScript type definitions
└── middleware.ts           # Next.js middleware for auth
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account
- A Stripe account (test mode works)
- A Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ryvynn02-14-26
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.local.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.local .env.local
   ```

4. **Run database migrations**
   
   See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed Supabase setup instructions.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

### Building for Production

```bash
npm run build
npm start
```

---

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions including:
- Supabase setup and migrations
- Stripe configuration and webhook setup
- Vercel deployment
- Environment variables
- Going to production
- Post-deployment verification

---

## Security

### Implemented Security Measures

✅ **Row Level Security (RLS)** on all database tables  
✅ **Client-side encryption** for sensitive journal data  
✅ **Stripe webhook signature verification**  
✅ **Server-side authentication checks**  
✅ **Usage limits** enforced server-side  
✅ **Admin role-based access control**  
✅ **Security headers** (CSP, X-Frame-Options, etc.)  
✅ **HTTPS-only** in production (Vercel)  
✅ **Service role key** never exposed to client  

### Data Privacy

- **Journal entries**: Encrypted client-side before storage, we cannot decrypt them
- **Crisis events**: Logged anonymously without storing triggering content
- **User data**: Minimal retention, user can delete account anytime
- **No third-party analytics** or tracking by default

---

## Database Schema

### Core Tables

- `profiles` - User account info and subscription plan
- `subscriptions` - Stripe subscription state
- `journal_entries` - Encrypted journal entries
- `usage_daily` - Daily usage tracking for rate limiting
- `events` - Anonymized analytics events

See [supabase/migrations/](./supabase/migrations/) for full schema.

---

## API Documentation

### Server Actions

#### Authentication (`lib/actions/auth.ts`)
- `signUp(email, password)` - Create new user account
- `signIn(email, password)` - Authenticate user
- `signOut()` - Sign out current user
- `getCurrentUser()` - Get current user profile
- `deleteAccount()` - Delete user account

#### The Flame (`lib/actions/flame.ts`)
- `callFlame(userMessage)` - Get Flame response
- `getFlameUsage()` - Get current usage stats

#### Stripe (`lib/stripe/actions.ts`)
- `createCheckoutSession()` - Start subscription checkout
- `createPortalSession()` - Open billing portal
- `getSubscriptionStatus()` - Get current subscription

### Webhooks

#### Stripe Webhook (`app/api/webhooks/stripe/route.ts`)
Handles:
- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Cancellations
- `invoice.payment_failed` - Failed payments
- `invoice.paid` - Successful payments

---

## The Flame Response Engine

The Flame uses a deterministic, rule-based system to provide mental wellness support:

### Components

1. **Emotion Detection** - Identifies primary emotion from user input
2. **Crisis Detection** - Checks for self-harm/suicide keywords
3. **Response Generation**:
   - **Reflection**: What I hear you saying
   - **Next Step**: One actionable suggestion
   - **Coping Tool**: Simple technique to try

### Crisis Levels

- **High**: Explicit self-harm/suicide intent → Show 988 hotline immediately
- **Medium**: Self-harm thoughts → Encourage professional help
- **Low**: General distress → Provide support resources

### Reading Level

All responses are written at a 4th-5th grade reading level:
- Short sentences
- Common words
- No medical/clinical jargon
- Direct, clear language

---

## Testing

### Manual Testing Checklist

- [ ] Sign up new user
- [ ] Confirm email
- [ ] Log in
- [ ] Send message to The Flame
- [ ] Verify usage counter updates
- [ ] Test crisis detection with keywords
- [ ] Create journal entry
- [ ] Verify journal encryption
- [ ] Start Stripe subscription (test mode)
- [ ] Verify usage limit increases
- [ ] Cancel subscription
- [ ] Access admin dashboard (as admin)

### Stripe Test Cards

Use these in test mode:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry, any CVC, any ZIP

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role secret | `eyJhbG...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | `pk_test_xxx` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_xxx` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_xxx` |
| `STRIPE_PRICE_ID_PREMIUM` | Stripe Price ID for premium plan | `price_xxx` |
| `NEXT_PUBLIC_APP_URL` | App URL for redirects | `https://app.ryvynn.com` |
| `ADMIN_EMAILS` | Comma-separated admin emails | `admin@ryvynn.com` |

---

## Contributing

This is a private project. For authorized contributors:

1. Create a feature branch from `main`
2. Make your changes
3. Test locally
4. Submit a pull request
5. Wait for review and approval

---

## License

Proprietary - All Rights Reserved

---

## Support

For issues or questions:
- **Technical**: Create an issue in this repository
- **Security**: Email security@ryvynn.com
- **General**: Contact support@ryvynn.com

---

## Acknowledgments

- **Next.js** - React framework
- **Supabase** - Backend infrastructure
- **Stripe** - Payment processing
- **Vercel** - Hosting and deployment
- **Web Crypto API** - Client-side encryption

---

## Important Disclaimers

⚠️ **RYVYNN is NOT a substitute for professional mental health care.**

⚠️ **In a crisis, call:**
- **988** (Suicide & Crisis Lifeline - US)
- **911** (Emergency Services - US)
- Your local emergency number

⚠️ **RYVYNN provides peer support, not medical advice or therapy.**

---

**Built with OMEGA BUILDER**  
**Privacy-First • Non-Clinical • Always Supportive**
