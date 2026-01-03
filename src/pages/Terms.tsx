import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

const Terms: React.FC = () => (
  <div className="space-y-4">
    <Helmet>
      <title>Terms of Service — Frenvio</title>
    </Helmet>

    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        By using Frenvio, you agree to these terms. Please read them carefully.
      </p>

      <h2 className="mt-6 text-xl font-extrabold">1. Your account</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
        <li>You are responsible for your account and activity.</li>
        <li>Do not share your password or attempt to access other accounts.</li>
        <li>We may suspend accounts that violate these terms or harm others.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">2. Content rules</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
        <li>No illegal content, harassment, hate, or threats.</li>
        <li>No spam or scams.</li>
        <li>Respect privacy: don’t post personal data without permission.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">3. Moderation</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        We may remove content or restrict features to keep Frenvio safe. Moderation decisions are made to protect the community.
      </p>

      <h2 className="mt-6 text-xl font-extrabold">4. Contact</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        Questions or reports? Use our <Link to="/contact" className="underline underline-offset-2">Contact</Link> page.
      </p>

      <p className="mt-6 text-xs text-slate-500">
        These terms may be updated. If we make big changes, we’ll communicate them inside the app.
      </p>
    </div>
  </div>
)

export default Terms
