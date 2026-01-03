# Frenvio

A modern social media web app built with **Vite + React + TypeScript + Tailwind** and **Supabase**.

## 1) Setup

### Install
```bash
npm install
```

### Environment variables
Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

Set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Run
```bash
npm run dev
```

## 2) Fixing refresh / direct links (Vercel)

This repo includes a `vercel.json` rewrite so that refreshing routes like `/dashboard` works on Vercel.

## 3) Optional: Images (posts, avatars, banners)

Create **public** Supabase Storage buckets:
- `post-images`
- `avatars`
- `banners`

If buckets are missing, posting still works (text-only) and the app will warn in console.

## 4) Email (welcome email + contact form)

The app uses a Supabase Edge Function: `supabase/functions/send-email`.

### Deploy the function
```bash
supabase functions deploy send-email
```

### Set secrets (IMPORTANT)
Set these in Supabase (NOT in your repo):
```bash
supabase secrets set NODEMAILER_USER="your_gmail@gmail.com"
supabase secrets set NODEMAILER_PASS="your_gmail_app_password"
```

After deploying and setting secrets, sign-up and contact messages can send email.

> If you enabled Supabase Auth email confirmations, users may need to confirm their email first.
