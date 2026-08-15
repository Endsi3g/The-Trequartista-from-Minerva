// Re-exported from a shared context provider (components/providers/
// CurrentUserProvider.tsx) so every consumer reads the same fetched
// profile instead of each running its own independent fetch-on-mount --
// see that file for why (avatar/name updates on /profil weren't reaching
// the sidebar or topbar).
export { useCurrentUser } from '@/components/providers/CurrentUserProvider';
