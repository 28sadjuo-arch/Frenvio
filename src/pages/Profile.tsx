import { useParams } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { supabase } from "../lib/supabase"
import { useEffect, useState } from "react"

type Profile = {
  id: string
  username: string
  name?: string
  location?: string
  bio?: string
  verified: boolean
}

const ProfilePage = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data as Profile)
      })
  }, [id])

  const saveProfile = async () => {
    await supabase
      .from("profiles")
      .update({
        name: profile?.name,
        location: profile?.location,
        bio: profile?.bio,
      })
      .eq("id", id)

    setEditing(false)
  }

  if (!profile) return <div>Loading...</div>

  const parseBio = (bio?: string) =>
    bio?.split(/(@\w+)/g).map((part, i) =>
      part.startsWith("@") ? (
        <a key={i} href="#" className="text-primary-500">
          {part}
        </a>
      ) : (
        part
      )
    )

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">
        {profile.username}
        {profile.verified && <span className="ml-1 text-blue-500">✔</span>}
      </h1>

      {editing ? (
        <>
          <input
            value={profile.name || ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Name"
          />
          <input
            value={profile.location || ""}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            placeholder="Location"
          />
          <textarea
            value={profile.bio || ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            placeholder="Bio"
          />
          <button onClick={saveProfile}>Save</button>
        </>
      ) : (
        <>
          <p>{profile.name}</p>
          <p>{profile.location}</p>
          <p>{parseBio(profile.bio)}</p>
        </>
      )}

      {user?.id === id && (
        <button onClick={() => setEditing(!editing)}>
          {editing ? "Cancel" : "Edit Profile"}
        </button>
      )}
    </div>
  )
}

export default ProfilePage
