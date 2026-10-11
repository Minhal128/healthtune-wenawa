import { useAuth } from '@/features/auth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();
  if (!isLoaded) {
    return null;
  }
  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }
  return <Redirect href="/home" />;
}
