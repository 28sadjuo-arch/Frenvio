import React from 'react'
import { Helmet } from 'react-helmet-async'

const About: React.FC = () => (
  <div className="max-w-2xl mx-auto mt-8 p-6">
    <Helmet>
      <title>About FRENVIO</title>
    </Helmet>
    <h1 className="text-3xl font-bold mb-4">About FREVIO</h1>
    <p className="mb-4">FRENVIO is a modern social platform founded by Amahoro Sadju, CEO.</p>
    <p>Our mission: Beautiful, secure, meaningful connections.</p>
    <div className="mt-8 space-x-4">
      <a href="https://twitter.com" className="text-primary-500">Twitter</a>
      <a href="https://facebook.com" className="text-primary-500">Facebook</a>
    </div>
  </div>
)

export default About