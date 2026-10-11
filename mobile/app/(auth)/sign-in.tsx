import {
  FormInput,
  SignInFormData,
  useAuth,
  useGoogleSSO,
  useSignIn,
  useSignInForm,
  useWarmUpBrowser,
} from '@/features/auth';
import { PRIMARY } from '@/features/shared/utils/theme';
import { MOCK_MODE } from '@/utils/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  useWarmUpBrowser();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn } = useAuth();
  const { signInWithGoogle } = useGoogleSSO();
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    getValues,
  } = useSignInForm();

  const canSubmit = MOCK_MODE || isValid;

  // Wait for auth state commit before leaving sign-in (avoids mock setState race → bounce back)
  useEffect(() => {
    if (isSignedIn) {
      router.replace('/home');
    }
  }, [isSignedIn, router]);

  const completeMockOrRealSignIn = async (email: string, password: string) => {
    const signInAttempt = await signIn.create({
      identifier: email,
      password,
    });

    if (signInAttempt.status === 'complete') {
      await setActive({ session: signInAttempt.createdSessionId });
      if (!MOCK_MODE) {
        router.replace('/');
      }
      return;
    }

    Alert.alert('Sign In Failed', 'Please check your credentials and try again.');
  };

  const onSubmit = async (data: SignInFormData) => {
    if (!isLoaded || isLoading) return;

    setIsLoading(true);

    try {
      await completeMockOrRealSignIn(data.email, data.password);
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || 'Sign in failed. Please try again.';
      Alert.alert('Sign In Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onMockSignIn = async () => {
    if (!isLoaded || isLoading) return;
    setIsLoading(true);
    try {
      const values = getValues();
      await completeMockOrRealSignIn(
        values.email || 'mock@healthtune.io',
        values.password || 'Password123'
      );
    } catch (err: any) {
      const errorMessage = err.errors?.[0]?.message || 'Sign in failed. Please try again.';
      Alert.alert('Sign In Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const result = await signInWithGoogle();
      console.log(result,"this is result")
      if (!result.success && result.error) {
        Alert.alert('Google Sign In Failed', result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[PRIMARY, '#0a3a36']}
        style={styles.headerGradient}
      >
        <Image 
          source={require('@/assets/images/healthtune.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appSubtitle}>AI-Powered Medical Transcriptions</Text>
      </LinearGradient>

      <View style={styles.cardContainer}>
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.welcome}>Welcome Back</Text>
          <Text style={styles.signInPrompt}>Sign in to continue</Text>

          <FormInput
            name="email"
            control={control}
            icon="email"
            placeholder="Email"
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />

          <FormInput
            name="password"
            control={control}
            icon="lock"
            placeholder="Password"
            error={errors.password}
            secureTextEntry={!showPassword}
            rightIcon={showPassword ? "visibility-off" : "visibility"}
            onRightIconPress={togglePasswordVisibility}
            editable={!isLoading}
          />

          <TouchableOpacity
            onPress={MOCK_MODE ? onMockSignIn : handleSubmit(onSubmit)}
            activeOpacity={0.8}
            style={[
              styles.signInButton,
              (!canSubmit || isLoading) && styles.signInButtonDisabled,
            ]}
            disabled={!canSubmit || isLoading}
          >
            <Text
              style={[
                styles.buttonText,
                (!canSubmit || isLoading) && styles.buttonTextDisabled,
              ]}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* <TouchableOpacity>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity> */}

            {/* <View style={styles.divider} />
            <Text style={styles.orText}>Or continue with</Text> */}
            
          {/* <TouchableOpacity 
            onPress={handleGoogleLogin} 
            style={[styles.googleButton, isLoading && styles.googleButtonDisabled]}
            disabled={isLoading}
          >
            <FontAwesome name="google" size={20} color={isLoading ? "#ccc" : "#db4437"} />
            <Text style={[styles.googleButtonText, isLoading && styles.googleButtonTextDisabled]}>
              {isLoading ? 'Please wait...' : 'Continue with Google'}
            </Text>
          </TouchableOpacity> */}

          {/* <View style={styles.signupPrompt}>
            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </View> */}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2' },
  headerGradient: {
    height: 220,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 64,
  },
  appSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 6 },

  cardContainer: {
    flex: 1,
    marginTop: -50,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 30,
    overflow: 'hidden',
  },
  formScroll: { paddingHorizontal: 24, paddingBottom: 20 },
  welcome: { fontSize: 22, fontWeight: '600', marginBottom: 4, color: '#134e4a' },
  signInPrompt: { fontSize: 14, color: '#666', marginBottom: 20 },

  signInButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 12,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  signInButtonDisabled: {
    backgroundColor: '#cccccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  buttonTextDisabled: { color: '#888' },

  forgotText: { color: PRIMARY, textAlign: 'center', marginTop: 8, fontSize: 14 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 20 },
  orText: { textAlign: 'center', color: '#999', marginBottom: 16 },
  
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ddd',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  googleButtonDisabled: {
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  googleButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  googleButtonTextDisabled: {
    color: '#ccc',
  },

  signupPrompt: { alignItems: 'center', marginTop: 24 },
  signupText: { color: '#666', fontSize: 14 },
  signupLink: { color: PRIMARY, fontWeight: 'bold' },
});