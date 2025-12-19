import React from 'react'
import { Helmet } from 'react-helmet-async'

const Blog: React.FC = () => (
  <div className="max-w-2xl mx-auto mt-8 p-6">
    <Helmet>
      <title>Blog - FRENVIO</title>
    </Helmet>
    <h1 className="text-3xl font-bold mb-4">Blog</h1>
    <article className="mb-8">
      <h2 className="text-2xl font-semibold">Building Meaningful Connections</h2>
      <p className="text-gray-600">In a world of noise, FRENVIO focuses on quality interactions...</p>
    </article>
    <article>
      <h2 className="text-2xl font-semibold">Why Realtime Chat Matters</h2>
      <p className="text-gray-600">Stay connected instantly with friends...</p>
    </article>
  </div>
)

export default Blog