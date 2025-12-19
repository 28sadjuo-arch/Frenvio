import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.functions.invoke('send-email', {
      to: import.meta.env.VITE_SUPPORT_EMAIL,
      subject: `FREVIO Support: ${formData.name}`,
      body: `${formData.message}\nFrom: ${formData.email}`
    })
    if (error) alert('Error: ' + error.message)
    else {
      alert('Message sent! We\'ll get back to you soon.')
      setFormData({ name: '', email: '', message: '' })
    }
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white dark:bg-gray-800 rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Contact Support</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700"
          required
        />
        <textarea
          placeholder="Your message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full p-2 mb-4 border rounded dark:bg-gray-700"
          rows={4}
          required
        />
        <button type="submit" disabled={loading} className="w-full bg-primary-500 text-white py-2 rounded disabled:opacity-50">
          {loading ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  )
}

export default Contact