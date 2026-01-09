import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, Profile } from '../lib/supabase'
import { Shield, Ban, Flag } from 'lucide-react'

const Admin: React.FC = () => {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      let query = supabase.from('profiles').select('*')
      if (search) query = query.ilike('username', `%${search}%`)
      const { data } = await query
      return data as Profile[]
    }
  })

  const { data: reports } = useQuery({
    queryKey: ['reports'],
    queryFn: async () => supabase.from('reports').select('*')
  })

  const verifyMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from('profiles').update({ verified: true }).eq('id', userId)
      // Send verification email
      await supabase.functions.invoke('send-email', {
        to: 'user@email.com', // Fetch email from profiles
        subject: 'Verified on FREVIO!',
        body: 'You are now verified.'
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  const banMutation = useMutation({
    mutationFn: async (userId: string) => {
      await supabase.from('profiles').update({ banned: true }).eq('id', userId)
      // Send ban email
      await supabase.functions.invoke('send-email', {
        to: 'user@email.com',
        subject: 'Account Suspended',
        body: 'Your account has been banned. Appeal at support@frenvio.com'
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  })

  const resolveReport = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: string }) => {
      await supabase.from('reports').update({ status }).eq('id', reportId)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] })
  })

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center"><Shield className="mr-2 h-6 w-6" /> Admin Dashboard</h1>
      
      <section className="mb-8">
        <h2 className="text-2xl mb-4">Users</h2>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="p-2 border rounded mb-4"
        />
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-800 rounded shadow">
            <thead>
              <tr>
                <th>Username</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.verified ? 'Yes' : 'No'}</td>
                  <td>
                    <button onClick={() => verifyMutation.mutate(user.id)} className="bg-green-500 text-white px-2 py-1 rounded mr-2">
                      Verify
                    </button>
                    <button onClick={() => banMutation.mutate(user.id)} className="bg-red-500 text-white px-2 py-1 rounded">
                      <Ban className="h-3 w-3 inline" /> Ban
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-2xl mb-4 flex items-center"><Flag className="mr-2 h-6 w-6" /> Reports</h2>
        <div className="overflow-x-auto">
          <table className="w-full bg-white dark:bg-gray-800 rounded shadow">
            <thead>
              <tr>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {reports?.data?.map((report: any) => (
                <tr key={report.id}>
                  <td>{report.reason}</td>
                  <td>{report.status}</td>
                  <td>
                    <select
                      defaultValue={report.status}
                      onChange={(e) => resolveReport.mutate({ reportId: report.id, status: e.target.value })}
                    >
                      <option value="pending">Pending</option>
                      <option value="resolved">Resolved</option>
                      <option value="actioned">Actioned</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default Admin