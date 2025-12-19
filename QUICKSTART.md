# SocialHub - Quick Start Guide

## Setup in 3 Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Supabase

Your `.env` file already contains Supabase credentials. The database is pre-configured with all necessary tables.

### Step 3: Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

## First-Time Experience

1. **Homepage** - See beautiful 3D background and reviews
2. **Sign Up** - Create account with username and display name
3. **Dashboard** - Discover users, add friends, manage profile

## Key Navigation

- **Logo** - Click to go home
- **Features** - Scroll to see app features
- **Reviews** - User testimonials section
- **About** - Founder section (AMAHORO SADJU)
- **Get Started** - Sign up button (shown to guests)
- **Theme Toggle** - Sun/Moon icon in navbar

## Dashboard Features

### Discover Tab
- Search for users by name or username
- View user profiles and bio
- Send friend requests
- See user online status

### Friends Tab
- View all accepted friends
- See friend online status
- Access friend profiles

### Messages Tab
- Coming soon - real-time chat with WebSocket support

## Customization

### Theme
- Light/Dark mode toggle
- Preference saved to localStorage
- Smooth transitions

### Profile
- Update avatar color
- Set display name and username
- Add bio and location
- Select interests

### Friend Requests
- Send requests to new users
- Accept/reject requests
- Block users (future feature)

## Database

All data is stored in Supabase PostgreSQL with:
- Row-Level Security enabled
- Automatic indexes for performance
- Real-time subscriptions
- Automatic timestamps

## API Endpoints

All interactions use Supabase client with real-time updates:

```typescript
import { supabase } from './lib/supabase';

// Fetch profiles
const { data } = await supabase.from('profiles').select('*');

// Real-time subscription
supabase.channel('profiles').on('*', handleChange).subscribe();
```

## Deployment

### Build
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel deploy
```

### Deploy to Netlify
```bash
netlify deploy --prod --dir=dist
```

## Troubleshooting

**3D Background not showing?**
- Check browser console for errors
- Ensure WebGL is enabled
- Clear browser cache

**Can't sign up?**
- Verify email format
- Check password requirements (8+ chars)
- Check Supabase dashboard status

**Database errors?**
- Verify `.env` has correct credentials
- Check Supabase project is active
- Review Supabase logs

## Next Steps

1. Add profile picture/avatar
2. Browse and connect with users
3. Write a review about your experience
4. Customize your theme preference

## Architecture Overview

```
Frontend (React/TypeScript)
        ↓
   Supabase
   ├── Auth (PostgreSQL users)
   ├── Database (Tables with RLS)
   ├── Real-time (WebSocket)
   └── Storage (User images)
```

## Key Files

- `src/App.tsx` - Main app component with routing
- `src/pages/Home.tsx` - Landing page with reviews
- `src/pages/Auth.tsx` - Login/signup forms
- `src/pages/Dashboard.tsx` - Main app interface
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/contexts/ThemeContext.tsx` - Theme state management
- `src/components/ThreeDBackground.tsx` - 3D background animation
- `src/lib/supabase.ts` - Supabase client and types

## Commands

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Check code quality
- `npm run typecheck` - TypeScript validation

---

Ready to transform social connections? Start building! 🚀
