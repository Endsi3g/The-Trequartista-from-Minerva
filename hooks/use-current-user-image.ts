import { useCurrentUser } from '@/hooks/use-current-user';

// See use-current-user-name.ts -- wraps the real profile source instead of
// auth user_metadata.
export const useCurrentUserImage = () => {
  const { avatarUrl } = useCurrentUser();
  return avatarUrl || null;
};
