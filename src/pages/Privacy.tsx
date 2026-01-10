import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

const Privacy: React.FC = () => (
  <div className="space-y-4">
    <Helmet>
      <title>Privacy Policy — Frenvio</title>
      <meta
        name="description"
        content="Learn how Frenvio collects, uses, and protects your information, and the choices you have."
      />
    </Helmet>

    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        At Frenvio, we respect your privacy. This Privacy Policy explains what information we collect, how we use it, and
        the choices you have. By using Frenvio, you agree to the collection and use of information as described here.
      </p>

      <h2 className="mt-6 text-xl font-extrabold">Information we collect</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-2">
        <li>
          <span className="font-bold">Account information:</span> the name, username, profile details, and contact details
          you provide when creating an account or updating your profile.
        </li>
        <li>
          <span className="font-bold">Content you create:</span> posts, comments, messages, images, voice notes, and other
          content you share on Frenvio.
        </li>
        <li>
          <span className="font-bold">Usage information:</span> basic analytics such as pages you view, features you use,
          and actions you take (for example, likes and follows) to help us improve the product.
        </li>
        <li>
          <span className="font-bold">Device information:</span> limited technical data like browser type, device type, and
          approximate location inferred from IP address (not your precise GPS location).
        </li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">How we use your information</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-2">
        <li>To provide and operate Frenvio (accounts, feeds, chats, notifications, and safety features).</li>
        <li>To personalize your experience (showing relevant posts, people, and conversations).</li>
        <li>To maintain security, prevent fraud, and enforce our Terms.</li>
        <li>To understand usage and improve reliability, performance, and design.</li>
        <li>To communicate with you about updates, important notices, or support requests.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">Sharing of information</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        We do not sell your personal information. We may share information in limited cases:
      </p>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-2">
        <li>
          <span className="font-bold">Public content:</span> content you post may be visible to other users depending on
          your settings (for example, your posts and profile).
        </li>
        <li>
          <span className="font-bold">Service providers:</span> we use trusted third‑party providers (such as hosting and
          storage) to operate Frenvio. They access data only to provide services to us.
        </li>
        <li>
          <span className="font-bold">Legal reasons:</span> if required by law, or to protect rights, safety, and security
          of Frenvio, our users, or the public.
        </li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">Data retention</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        We keep your information only as long as necessary to provide the service and meet legal, security, or operational
        requirements. You can delete certain content from within the app, and you may request account deletion.
      </p>

      <h2 className="mt-6 text-xl font-extrabold">Security</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        We use reasonable safeguards to protect your information. However, no method of transmission or storage is 100%
        secure. Please use a strong password and keep your account credentials private.
      </p>

      <h2 className="mt-6 text-xl font-extrabold">Your choices</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-2">
        <li>You can update your profile information at any time from your profile settings.</li>
        <li>You can manage visibility by choosing what you post and which details you share publicly.</li>
        <li>You can request a copy or deletion of your account data by contacting us.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">Contact</h2>
      <p className="mt-2 text-slate-600 dark:text-slate-300">
        If you have questions about this Privacy Policy, contact us via the{' '}
        <Link to="/contact" className="font-bold text-blue-600 hover:underline">
          contact page
        </Link>
        .
      </p>

      <p className="mt-6 text-sm text-slate-500">
        See also: {' '}
        <Link to="/terms" className="font-bold text-blue-600 hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    </div>
  </div>
)

export default Privacy
