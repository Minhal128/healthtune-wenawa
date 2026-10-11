import { useAuth } from '@/features/auth';
import { Redirect, Stack } from 'expo-router';

const PrimaryLayout = () => {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <Stack>
      <Stack.Screen name="create-quick-notes" options={{ headerShown: false }} />
      <Stack.Screen name="session-notes" options={{ headerShown: false }} />
      <Stack.Screen name="note-player" options={{ headerShown: false }} />
      <Stack.Screen name="session-details" options={{ headerShown: false }} />
    </Stack>
  );
};

export default PrimaryLayout;
