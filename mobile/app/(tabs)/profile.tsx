import { LanguageSelectionScreen } from '@/features/shared/components';
import FloatingVoiceButton from '@/features/shared/components/FloatingVoiceButton';
import { useLanguage } from '@/features/shared/hooks';
import { formatFullDate } from '@/features/shared/utils/dateUtils';
import { PRIMARY } from '@/features/shared/utils/theme';
import { useAuth, useUser } from '@/features/auth';
import { FontAwesome, Ionicons, MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Flag from 'react-native-country-flag';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { currentLanguage, getCurrentLanguageName, getCurrentLanguageFlag } = useLanguage();
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);

  // Helper function to get display name
  const getDisplayName = () => {
    if (user?.fullName) {
      return user.fullName;
    }
    
    const firstName = user?.firstName?.trim();
    const lastName = user?.lastName?.trim();
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else if (user?.primaryEmailAddress?.emailAddress) {
      // Extract name from email (before @ symbol)
      const emailName = user.primaryEmailAddress.emailAddress.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      return emailName
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return 'User';
  };

  // Helper function to get full name for account info section
  const getFullNameForInfo = () => {
    if (user?.fullName) {
      return user.fullName;
    }
    
    const firstName = user?.firstName?.trim();
    const lastName = user?.lastName?.trim();
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    
    return 'Not provided';
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/sign-in');
            } catch (error) {
              console.error('Error signing out:', error);
              // Still redirect even if there's an error
              router.replace('/sign-in');
            }
          },
        },
      ]
    );
  };

  const ProfileItem = ({ icon, title, subtitle, iconFamily = 'MaterialIcons', onPress }: {
    icon: string;
    title: string;
    subtitle?: string | React.ReactNode;
    iconFamily?: 'MaterialIcons' | 'Ionicons' | 'FontAwesome';
    onPress?: () => void;
  }) => {
    const IconComponent = iconFamily === 'MaterialIcons' ? MaterialIcons : 
                         iconFamily === 'Ionicons' ? Ionicons : FontAwesome;
    
    return (
      <TouchableOpacity style={styles.profileItem} onPress={onPress}>
        <View style={styles.profileItemLeft}>
          <View style={styles.iconContainer}>
            <IconComponent name={icon as any} size={24} color={PRIMARY} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.profileItemTitle}>{title}</Text>
            {subtitle && (
              typeof subtitle === 'string' ? (
                <Text style={styles.profileItemSubtitle}>{subtitle}</Text>
              ) : (
                subtitle
              )
            )}
          </View>
        </View>
        <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[PRIMARY, '#059669']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {user?.imageUrl ? (
              <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <FontAwesome name="user" size={40} color="white" />
              </View>
            )}
          </View>
                     <Text style={styles.userName}>
             {getDisplayName()}
           </Text>
          <Text style={styles.userEmail}>
            {user?.primaryEmailAddress?.emailAddress || 'No email'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
                     <ProfileItem
             icon="person"
             title="Full Name"
             subtitle={getFullNameForInfo()}
           />
          
          <ProfileItem
            icon="email"
            title="Email Address"
            subtitle={user?.primaryEmailAddress?.emailAddress || 'Not provided'}
          />
          
          <ProfileItem
            icon="phone"
            title="Phone Number"
            subtitle={user?.primaryPhoneNumber?.phoneNumber || 'Not provided'}
          />
          
          <ProfileItem
            icon="calendar-today"
            title="Member Since"
            subtitle={user?.createdAt ? formatFullDate(user.createdAt as any) : 'Unknown'}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
{/*           
          <ProfileItem
            icon="notifications"
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => {
              // Navigate to notifications settings
              Alert.alert('Coming Soon', 'Notification settings will be available soon.');
            }}
          />
           */}
          {/* <ProfileItem
            icon="security"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => {
              // Navigate to privacy settings
              Alert.alert('Coming Soon', 'Privacy settings will be available soon.');
            }}
          /> */}
          
          <ProfileItem
            icon="language"
            title="Language"
            subtitle={
              <View style={styles.languageSubtitle}>
                <Flag isoCode={getCurrentLanguageFlag()} size={16} />
                <Text style={styles.languageText}>{getCurrentLanguageName()}</Text>
              </View>
            }
            onPress={() => {
              setShowLanguageSelection(true);
            }}
          />
          
          <ProfileItem
            icon="info"
            title="App Version"
            subtitle={`v${Constants.expoConfig?.version || '1.0.0'}`}
          />
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <ProfileItem
            icon="help"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => {
              Alert.alert('Coming Soon', 'Help & support will be available soon.');
            }}
          />
          
          <ProfileItem
            icon="info"
            title="About"
            subtitle="App version and information"
            onPress={() => {
              Alert.alert('About', 'HealthTune Mobile v1.0.0');
            }}
          />
        </View> */}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="white" />
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <FloatingVoiceButton />
      
      <LanguageSelectionScreen
        visible={showLanguageSelection}
        onClose={() => setShowLanguageSelection(false)}
        onLanguageSelect={() => {
          setShowLanguageSelection(false);
        }}
        showHeader={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 32,
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  languageSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
}); 