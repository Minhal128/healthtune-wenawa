import { MOCK_MODE } from '@/utils/constants';
import { ClerkProvider, useAuth as useClerkAuth, useSignIn as useClerkSignIn, useUser as useClerkUser } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

type MockUser = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  createdAt?: Date | number | string;
  primaryEmailAddress: { emailAddress: string };
  primaryPhoneNumber?: { phoneNumber: string } | null;
  emailAddresses: { emailAddress: string }[];
  unsafeMetadata: Record<string, unknown>;
  update: (data: { unsafeMetadata: Record<string, unknown> }) => Promise<void>;
};

type AuthSlice = {
  isSignedIn: boolean;
  isLoaded: boolean;
  userId: string | null | undefined;
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
};

type UserSlice = {
  user: MockUser | null | undefined;
  isLoaded: boolean;
};

type SignInSlice = {
  isLoaded: boolean;
  signIn: {
    create: (args: { identifier: string; password: string }) => Promise<{
      status: string;
      createdSessionId: string;
    }>;
  };
  setActive: (args: { session: string }) => Promise<void>;
};

type AuthContextValue = {
  auth: AuthSlice;
  userApi: UserSlice;
  signInApi: SignInSlice;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('Auth hooks must be used within AppAuthProvider');
  }
  return ctx;
}

export function useAuth(): AuthSlice {
  return useAuthContext().auth;
}

export function useUser(): UserSlice {
  return useAuthContext().userApi;
}

export function useSignIn(): SignInSlice {
  return useAuthContext().signInApi;
}

function MockAuthInner({ children }: { children: React.ReactNode }) {
  // Plan: mock mode always signed in so tabs/primary are reachable without Clerk
  const [isSignedIn, setSignedIn] = useState(true);
  const [unsafeMetadata, setUnsafeMetadata] = useState<Record<string, unknown>>({
    language: 'en',
  });

  const signOut = useCallback(async () => {
    setSignedIn(false);
  }, []);

  const updateUser = useCallback(async (data: { unsafeMetadata: Record<string, unknown> }) => {
    setUnsafeMetadata(data.unsafeMetadata);
  }, []);

  const user: MockUser | null = isSignedIn
    ? {
        id: 'mock-user-1',
        fullName: 'Dr. Mock Clinician',
        firstName: 'Mock',
        lastName: 'Clinician',
        primaryEmailAddress: { emailAddress: 'mock@healthtune.io' },
        primaryPhoneNumber: null,
        emailAddresses: [{ emailAddress: 'mock@healthtune.io' }],
        createdAt: Date.now(),
        unsafeMetadata,
        update: updateUser,
      }
    : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      auth: {
        isSignedIn,
        isLoaded: true,
        userId: isSignedIn ? 'mock-user-1' : null,
        getToken: async () => (isSignedIn ? 'mock-token' : null),
        signOut,
      },
      userApi: {
        user,
        isLoaded: true,
      },
      signInApi: {
        isLoaded: true,
        signIn: {
          create: async () => ({
            status: 'complete',
            createdSessionId: 'mock-session',
          }),
        },
        setActive: async () => {
          setSignedIn(true);
        },
      },
    }),
    [isSignedIn, user, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ClerkAuthInner({ children }: { children: React.ReactNode }) {
  const clerkAuth = useClerkAuth();
  const { user, isLoaded: userLoaded } = useClerkUser();
  const clerkSignIn = useClerkSignIn();

  const value = useMemo<AuthContextValue>(
    () => ({
      auth: {
        isSignedIn: !!clerkAuth.isSignedIn,
        isLoaded: !!clerkAuth.isLoaded,
        userId: clerkAuth.userId,
        getToken: async () => (await clerkAuth.getToken()) ?? null,
        signOut: async () => {
          await clerkAuth.signOut();
        },
      },
      userApi: {
        user: user as unknown as MockUser | null | undefined,
        isLoaded: userLoaded,
      },
      signInApi: {
        isLoaded: !!clerkSignIn.isLoaded,
        signIn: {
          create: async (args) => {
            const result = await clerkSignIn.signIn!.create(args);
            return {
              status: result.status || 'unknown',
              createdSessionId: result.createdSessionId || '',
            };
          },
        },
        setActive: async ({ session }) => {
          await clerkSignIn.setActive!({ session });
        },
      },
    }),
    [clerkAuth, user, userLoaded, clerkSignIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  if (MOCK_MODE) {
    return <MockAuthInner>{children}</MockAuthInner>;
  }

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <ClerkAuthInner>{children}</ClerkAuthInner>
    </ClerkProvider>
  );
}
