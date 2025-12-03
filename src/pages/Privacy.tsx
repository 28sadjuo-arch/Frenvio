import React from 'react'
import { Helmet } from 'react-helmet-async'

const Privacy: React.FC = () => (
  <div className="max-w-3xl mx-auto mt-8 p-6 prose dark:prose-invert">
    <Helmet>
      <title>Privacy Policy - FRENVIO</title>
    </Helmet>
    <h1>Privacy Policy</h1>
    <p>Last updated: June 3, 2025</p>
    <p>FRENVIO ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information.</p>
    <h2>Information We Collect</h2>
    <p>We collect personal data such as email, username, and posts to provide our services. We do not sell your data.</p>
    <h2>How We Use It</h2>
    <p>To enable features like chat, notifications, and profiles. Data is stored securely in Supabase with RLS enabled.</p>
    <h2>Your Rights</h2>
    <p>You can access, update, or delete your data. Contact support@frenvio.com for requests. Compliant with GDPR/CCPA.</p>
    <p>Changes to this policy will be posted here. Continued use constitutes acceptance.</p>
    <p>Contact: Amahoro Sadju, Founder & CEO.</p>
  </div>
)

export default Privacy