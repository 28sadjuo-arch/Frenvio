# SocialHub - Next-Generation Social Web App

A stunning, immersive social platform featuring real-time chat, friend discovery, 3D interactive backgrounds, and beautiful dark/light modes. Built with React, TypeScript, Supabase, Three.js, and Framer Motion.

## Features

- **🎨 3D Immersive Homepage** - Interactive Three.js background with particles and animations
- **🔐 Secure Authentication** - Email/password auth with Supabase
- **👥 Friend Discovery** - Browse and connect with other users
- **💬 Real-time Messaging** - Chat system with RLS security
- **🎭 User Profiles** - Customizable profiles with avatars and bio
- **⭐ Reviews & Ratings** - Community feedback system
- **🌓 Dark/Light Mode** - Beautiful theme toggle with persistence
- **📱 Mobile Responsive** - Fully responsive design across all devices
- **⚡ Performance Optimized** - Fast load times with lazy loading and efficient rendering

## Architecture

```
src/
├── components/
│   └── ThreeDBackground.tsx      # 3D background with Three.js
├── contexts/
│   ├── AuthContext.tsx            # Authentication state management
│   └── ThemeContext.tsx           # Dark/light mode management
├── lib/
│   └── supabase.ts               # Supabase client & types
├── pages/
│   ├── Auth.tsx                   # Login/Register pages
│   ├── Home.tsx                   # Landing page with reviews
│   └── Dashboard.tsx              # Main app with chat/friends
├── App.tsx                        # Main app component
├── main.tsx                       # React entry point
└── index.css                      # Global styles
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **3D Graphics**: Three.js
- **Animations**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Build**: Vite
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## Database Schema

### Tables Created

- **profiles** - User profiles with avatars and settings
- **friendships** - Friend connections and requests
- **rooms** - Chat room containers
- **room_members** - Room membership tracking
- **messages** - Direct and group messages
- **reviews** - User reviews and ratings
- **activities** - User interactions for recommendations

### Security

- All tables have Row Level Security (RLS) enabled
- Users can only access their own data
- Public read access for reviews and profiles
- Encrypted message support

## Core Functionality

### Authentication

Users can sign up with email/password. On registration, a profile is automatically created:

```typescript
const { signUp, signIn, signOut } = useAuth();
await signUp(email, password, username, displayName);
```

### Friend System

- Browse all users
- Send friend requests
- Accept/reject requests
- View friend list

### Real-time Updates

Supabase real-time subscriptions handle:
- Profile status updates
- Friendship changes
- Message delivery
- Friend online status

### Theme Management

```typescript
const { theme, toggleTheme } = useTheme();
```

Dark mode preference is saved to localStorage.

## File Organization

Each feature is organized into logical modules:

- **Components**: Reusable UI components (3D background, cards)
- **Contexts**: Global state (Auth, Theme)
- **Pages**: Complete page layouts (Auth, Home, Dashboard)
- **Lib**: Utility functions and type definitions

## Styling

- Tailwind CSS for utility-first styling
- Dark mode support with class-based strategy
- Responsive design with mobile-first approach
- Custom animations with Framer Motion
- 3D rendered backgrounds with Three.js

## Deployment

### Build for Production

```bash
npm run build
```

Creates optimized bundle in `dist/` directory.

### Deploy to Hosting

#### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

#### Netlify

```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

#### Docker Deployment

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

Build and run:

```bash
docker build -t socialhub .
docker run -p 3000:3000 socialhub
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Check TypeScript types

### Environment Variables

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

## Future Enhancements

- **Video/Audio Chat** - Group calls with spatial audio
- **3D Avatars** - Customizable 3D character representations
- **Gamification** - Badges, levels, and rewards
- **Mini-Games** - Interactive 3D challenges
- **Ephemeral Stories** - Temporary post features
- **Advanced Search** - Full-text search with filters
- **AI Recommendations** - ML-powered friend suggestions
- **Group Management** - Moderation and custom roles
- **Analytics Dashboard** - User insights and metrics

## Performance Optimization

- **Code Splitting** - Route-based code splitting via dynamic imports
- **Lazy Loading** - Images and components load on demand
- **Memoization** - React.memo for expensive components
- **Optimized Assets** - Minified CSS and JS bundles
- **Caching** - Supabase caching for frequent queries
- **CDN** - Static assets served from CDN

## Security Best Practices

- RLS policies restrict data access
- Environment variables for sensitive keys
- HTTPS enforced for all connections
- Password hashing by Supabase
- CSRF protection enabled
- Input validation on frontend and backend

## Troubleshooting

### Build Errors

Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues

1. Verify Supabase URL and key in `.env`
2. Check Supabase dashboard is accessible
3. Ensure RLS policies allow your user
4. Review Supabase logs for errors

### 3D Background Not Rendering

- Check browser WebGL support
- Verify Three.js bundle is loaded
- Check browser console for errors
- Try disabling hardware acceleration

## Contributing

Contributions welcome! Please:
1. Create feature branches
2. Write clear commit messages
3. Test thoroughly
4. Submit pull requests

## License

MIT License - Feel free to use this project

## Support

For issues or questions:
- Check GitHub issues
- Review Supabase documentation
- Check browser console for errors
- Verify environment variables

---

Built with ❤️ by AMAHORO SADJU

Transform the way people connect online.
