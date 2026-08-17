'use client'

import { useMemo } from 'react'

import { AvatarStack } from '@/components/avatar-stack'
import { useRealtimePresenceRoom } from '@/hooks/use-realtime-presence-room'

export const RealtimeAvatarStack = ({ roomName }: { roomName: string }) => {
  // otherUsers already excludes the signed-in user -- an "avatar stack of
  // who's online" showing your own face isn't useful, it only confirms
  // you're logged in, which you already know.
  const { otherUsers: usersMap } = useRealtimePresenceRoom(roomName)
  const avatars = useMemo(() => {
    return Object.values(usersMap).map((user) => ({
      name: user.name,
      image: user.image,
    }))
  }, [usersMap])

  return <AvatarStack avatars={avatars} />
}
