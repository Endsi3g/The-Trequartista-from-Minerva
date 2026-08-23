'use client'

import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

import { useCurrentUser } from '@/hooks/use-current-user'
import { useCurrentUserImage } from '@/hooks/use-current-user-image'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { createClient } from '@/lib/supabase/client'

export type RealtimeUser = {
  id: string
  name: string
  image: string
  [key: string]: unknown
}

// Keyed by the signed-in user's own id (not a random per-connection ref),
// so a teammate with two open tabs shows once, and the caller can reliably
// tell which entry is "me" to exclude it from an "other people online"
// display -- the whole point of a presence indicator is to show who ELSE
// is active, not to confirm you're looking at your own screen.
export const useRealtimePresenceRoom = (
  roomName: string,
  extra?: Record<string, unknown>,
  // False for a viewer who should only watch the room, never join it (a
  // client-portal account subscribing to the team's public presence room
  // must never announce itself as a present "team member").
  shouldTrack: boolean = true
) => {
  const { id: currentUserId } = useCurrentUser()
  const currentUserName = useCurrentUserName()
  const currentUserImage = useCurrentUserImage()

  const [users, setUsers] = useState<Record<string, RealtimeUser>>({})

  useEffect(() => {
    if (!currentUserId) return

    const supabase = createClient()
    const room = supabase.channel(roomName, {
      config: { presence: { key: currentUserId } },
    })

    room
      .on('presence', { event: 'sync' }, () => {
        const newState = room.presenceState<RealtimeUser>()
        const newUsers = Object.fromEntries(
          Object.entries(newState).map(([key, values]) => [key, values[0]])
        ) as Record<string, RealtimeUser>
        setUsers(newUsers)
      })
      .subscribe(async (status) => {
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED && shouldTrack) {
          await room.track({
            id: currentUserId,
            name: currentUserName,
            image: currentUserImage,
            ...extra,
          })
        } else if (status !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          setUsers({})
        }
      })

    return () => {
      room.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, currentUserId, currentUserName, currentUserImage, shouldTrack, JSON.stringify(extra)])

  const otherUsers = Object.fromEntries(
    Object.entries(users).filter(([key]) => key !== currentUserId)
  )

  return { users, otherUsers, currentUserId }
}
