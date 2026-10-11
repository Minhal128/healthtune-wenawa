import { MOCK_MODE } from '@/utils/constants';
import { useSSO } from '@clerk/clerk-expo';
import * as AuthSession from 'expo-auth-session';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect } from 'react';

export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

function useGoogleSSOClerk() {
  const { startSSOFlow } = useSSO();
  const router = useRouter();

  const signInWithGoogle = useCallback(async () => {
    try {
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
        router.replace('/(tabs)/home');
        return { success: true };
      }

      if (signIn?.status === 'needs_identifier' && signUp) {
        if (signUp.status === 'complete') {
          await setActive!({ session: signUp.createdSessionId! });
          router.replace('/(tabs)/home');
          return { success: true };
        }

        if (signUp.status === 'missing_requirements') {
          const completed = await signUp.create({
            emailAddress: signUp.emailAddress || undefined,
            firstName: signUp.firstName || undefined,
            lastName: signUp.lastName || undefined,
          });

          if (completed.status === 'complete') {
            await setActive!({ session: completed.createdSessionId! });
            router.replace('/(tabs)/home');
            return { success: true };
          }
        }
      }

      if (signIn?.status === 'complete') {
        await setActive!({ session: signIn.createdSessionId! });
        router.replace('/(tabs)/home');
        return { success: true };
      }

      return { success: false, error: 'Authentication incomplete' };
    } catch (error: any) {
      console.error('Google SSO Error:', error);
      return {
        success: false,
        error: error.errors?.[0]?.message || 'Authentication failed',
      };
    }
  }, [startSSOFlow, router]);

  return { signInWithGoogle };
}

function useGoogleSSOMock() {
  return {
    signInWithGoogle: async () => ({
      success: false as const,
      error: 'Google SSO disabled in mock mode',
    }),
  };
}

// Bundle-time constant — only one hook implementation is used per build
export const useGoogleSSO = MOCK_MODE ? useGoogleSSOMock : useGoogleSSOClerk;
