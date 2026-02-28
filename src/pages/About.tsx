import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

const About: React.FC = () => (
  <div className="space-y-4">
    <Helmet>
      <title>About Frenvio</title>
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About Frenvio",
          "mainEntity": {
            "@type": "Organization",
            "name": "Frenvio",
            "founder": {
              "@type": "Person",
              "name": "Amahoro Sadju",
              "jobTitle": "Founder & CEO"
            }
          }
        })}
      </script>
    </Helmet>

    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">About Frenvio</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        Frenvio is a social platform built for sharing , discovering people, and chatting with friends. We focus on speed, great experience, and community-first features. It was founded by:
      </p>

      <div className="mt-5 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="font-extrabold">Amahoro Sadju</div>
          <div className="mt-1 text-slate-700 dark:text-slate-200">Founder & CEO</div>
          <div className="text-sm text-slate-500">Frenvio Inc.</div>
          <a
            href="https://instagram.com/sadjuo"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold"
          >
            Instagram
          </a>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="font-extrabold">Ines Olga</div>
          <div className="mt-1 text-slate-700 dark:text-slate-200">Co-founder</div>
          <div className="text-sm text-slate-500">Frenvio Inc.</div>
          <a
            href="https://instagram.com/olga_inees"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-sm font-semibold"
          >
            Instagram
          </a>
        </div>
      </div>

      <h2 className="mt-6 text-xl font-extrabold">What we believe</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
        <li>People deserve control over their experience.</li>
        <li>Safety and privacy are not “extra features”.</li>
        <li>Free Speech for everyone.</li>
        <li>Communities grow best with trust.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">Roadmap highlights</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
        <li>Verified profiles and creator tools</li>
        <li>Media posts and replies/comments</li>
        <li>Notifications for likes, follows, mentions</li>
        <li>Groups and Direct message for communication</li>
      </ul>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/contact" className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          Contact us
        </Link>
        <Link to="/terms" className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold">
          Terms
        </Link>
        <Link to="/privacy" className="px-4 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold">
          Privacy
        </Link>
      </div>
    </div>
  </div>
)

export default About
