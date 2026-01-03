import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

const Privacy: React.FC = () => (
  <div className="space-y-4">
    <Helmet>
      <title>Privacy Policy — Frenvio</title>
    </Helmet>

    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        We respect your privacy. This policy explains what data we collect, why we collect it, and how you can control it.
      </p>

      <h2 className="mt-6 text-xl font-extrabold">What we collect</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
        <li>Account data: email, username, and profile details you provide.</li>
        <li>Content: posts and messages you create.</li>
        <li>Usage data: basic analytics to improve performance and reliability.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">How we use it</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
        <li>To run the service: authentication, posting, messaging, and notifications.</li>
        <li>To keep the platform safe: abuse prevention and moderation.</li>
        <li>To improve Frenvio: bug fixes and product iteration.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">Your choices</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
        <li>Edit your profile anytime.</li>
        <li>Request account deletion from Settings.</li>
        <li>Contact us if you have privacy questions.</li>
      </ul>

      <p className="mt-6 text-sm text-slate-500">
        Questions? Reach out via <Link to="/contact" className="underline underline-offset-2">Contact</Link>.
      </p>
    </div>
  </div>
)

export default Privacy
