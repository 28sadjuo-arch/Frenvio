import React from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

const About: React.FC = () => (
  <div className="space-y-4">
    <Helmet>
      <title>About Frenvio</title>
    </Helmet>

    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h1 className="text-3xl font-extrabold tracking-tight">About Frenvio</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-300">
        Frenvio is a social media platform focused on simple sharing, real conversations, and a clean experience.
      </p>

      <div className="mt-5 grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="font-extrabold">Founder &amp; CEO</div>
          <div className="mt-1 text-slate-700 dark:text-slate-200">Amahoro Sadju</div>
          <div className="text-sm text-slate-500">Product, vision, and engineering</div>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
          <div className="font-extrabold">Co‑Founder</div>
          <div className="mt-1 text-slate-700 dark:text-slate-200">Ines Olga</div>
          <div className="text-sm text-slate-500">Community and growth</div>
        </div>
      </div>

      <h2 className="mt-6 text-xl font-extrabold">What we believe</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
        <li>People deserve control over their experience.</li>
        <li>Safety and privacy are not “extra features”.</li>
        <li>Great design should feel effortless.</li>
        <li>Communities grow best with trust and transparency.</li>
      </ul>

      <h2 className="mt-6 text-xl font-extrabold">Roadmap highlights</h2>
      <ul className="mt-2 list-disc pl-5 text-slate-600 dark:text-slate-300 space-y-1">
        <li>Verified profiles and creator tools</li>
        <li>Better media posts and replies/comments</li>
        <li>Real notifications for likes, follows, mentions</li>
        <li>Groups and message requests</li>
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
