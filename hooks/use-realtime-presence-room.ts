'use client'

import { REALTIME_SUBSCRIBE_STATES, type RealtimeChannel } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'

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

interface RoomEntry {
  channel: RealtimeChannel
  subscribed: boolean
  users: Record<string, RealtimeUser>
  listeners: Set<(users: Record<string, RealtimeUser>) => void>
  trackedExtras: Map<string, Record<string, unknown>>
  baseIdentity: { id: string; name: string; image: string } | null
}

// Supabase's realtime client reuses ONE RealtimeChannel object per topic
// string within a tab (see RealtimeClient.channel() -- "if a channel with
// the same topic already exists it will be returned instead of creating a
// duplicate connection"). Two independent components can legitimately watch
// the same room (e.g. TeamPresence and NativeNotificationProvider both
// watch 'minerva-team-presence'); the second one calling channel().on()
// after the first already called .subscribe() on that shared object throws
// ("cannot add `presence` callbacks ... after `subscribe()`") and crashed
// every page. This module-level registry makes channel creation + the
// .on()/.subscribe() pair happen exactly once per room name, with every
// hook instance sharing the resulting presence state and merging their
// `extra` payloads into a single track() call (presence track() replaces
// the whole payload for a given key, so two callers can't track separate
// payloads for the same user on the same channel).
const rooms = new Map<string, RoomEntry>()
let instanceCounter = 0

function getOrCreateRoom(roomName: string, currentUserId: string): RoomEntry {
  let entry = rooms.get(roomName)
  if (!entry) {
    const supabase = createClient()
    entry = {
      channel: supabase.channel(roomName, { config: { presence: { key: currentUserId } } }),
      subscribed: false,
      users: {},
      listeners: new Set(),
      trackedExtras: new Map(),
      baseIdentity: null,
    }
    rooms.set(roomName, entry)
  }
  return entry
}

function retrack(entry: RoomEntry) {
  if (!entry.subscribed || !entry.baseIdentity) return
  const merged: Record<string, unknown> = { ...entry.baseIdentity }
  for (const extra of entry.trackedExtras.values()) Object.assign(merged, extra)
  entry.channel.track(merged)
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
  const instanceIdRef = useRef<string | undefined>(undefined)
  if (!instanceIdRef.current) instanceIdRef.current = `presence-${++instanceCounter}`

  useEffect(() => {
    if (!currentUserId) return
    const instanceId = instanceIdRef.current!
    const entry = getOrCreateRoom(roomName, currentUserId)
    entry.listeners.add(setUsers)
    setUsers(entry.users)

    if (!entry.subscribed) {
      entry.subscribed = true
      entry.channel
        .on('presence', { event: 'sync' }, () => {
          const newState = entry.channel.presenceState<RealtimeUser>()
          const newUsers = Object.fromEntries(
            Object.entries(newState).map(([key, values]) => [key, values[0]])
          ) as Record<string, RealtimeUser>
          entry.users = newUsers
          entry.listeners.forEach((fn) => fn(newUsers))
        })
        .subscribe(async (status) => {
          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            retrack(entry)
          } else {
            entry.users = {}
            entry.listeners.forEach((fn) => fn({}))
          }
        })
    }

    return () => {
      entry.listeners.delete(setUsers)
      entry.trackedExtras.delete(instanceId)
      if (entry.listeners.size === 0) {
        entry.channel.unsubscribe()
        rooms.delete(roomName)
      } else {
        retrack(entry)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, currentUserId])

  useEffect(() => {
    if (!currentUserId || !shouldTrack) return
    const entry = rooms.get(roomName)
    if (!entry) return
    entry.baseIdentity = { id: currentUserId, name: currentUserName, image: currentUserImage || '' }
    entry.trackedExtras.set(instanceIdRef.current!, extra || {})
    retrack(entry)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName, currentUserId, currentUserName, currentUserImage, shouldTrack, JSON.stringify(extra)])

  const otherUsers = Object.fromEntries(
    Object.entries(users).filter(([key]) => key !== currentUserId)
  )

  return { users, otherUsers, currentUserId }
}
