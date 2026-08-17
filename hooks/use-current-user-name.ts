import { useCurrentUser } from '@/hooks/use-current-user';

// Wraps the app's real profile source (profiles table, shared context) so
// the name shown in presence/avatar components matches what's shown
// everywhere else -- the registry's default reads auth user_metadata,
// which this app doesn't populate.
export const useCurrentUserName = () => {
  const { fullName, email } = useCurrentUser();
  return fullName || email || 'Membre';
};
