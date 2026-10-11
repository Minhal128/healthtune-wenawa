import { PRIMARY } from '@/features/shared/utils/theme';
import { Language, SUPPORTED_LANGUAGES, getLanguageByCode } from '@/utils/constants';
import { useUser } from '@/features/auth';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Flag from 'react-native-country-flag';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LanguageSelectionScreenProps {
  onLanguageSelect?: (language: Language) => void;
  showHeader?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

export const LanguageSelectionScreen: React.FC<LanguageSelectionScreenProps> = ({
  onLanguageSelect,
  showHeader = true,
  visible = false,
  onClose,
}) => {
  const { user } = useUser();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [isLoading, setIsLoading] = useState(false);

  // Get current language from user metadata
  useEffect(() => {
    const currentLanguageCode = user?.unsafeMetadata?.language as string;
    if (currentLanguageCode) {
      const language = getLanguageByCode(currentLanguageCode);
      setSelectedLanguage(language);
    }
  }, [user?.unsafeMetadata?.language]);

  const handleLanguageSelect = async (language: Language) => {
    if (language.code === selectedLanguage.code) return;

    setIsLoading(true);
    try {
      // Update user metadata with new language
      await user?.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          language: language.code,
        },
      });

      setSelectedLanguage(language);
      onLanguageSelect?.(language);
      onClose?.();
      
      Alert.alert(
        'Language Updated',
        `Your language has been changed to ${language.name}`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating language:', error);
      Alert.alert(
        'Error',
        'Failed to update language. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderLanguageItem = ({ item }: { item: Language }) => {
    const isSelected = item.code === selectedLanguage.code;
    
    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          isSelected && styles.selectedLanguageItem
        ]}
        onPress={() => handleLanguageSelect(item)}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <View style={styles.languageItemLeft}>
          <View style={styles.flagContainer}>
            <Flag isoCode={item.flag} size={24} />
          </View>
          <View style={styles.languageInfo}>
            <Text style={[
              styles.languageName,
              isSelected && styles.selectedLanguageName
            ]}>
              {item.name}
            </Text>
            <Text style={[
              styles.languageNativeName,
              isSelected && styles.selectedLanguageNativeName
            ]}>
              {item.nativeName}
            </Text>
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.checkmarkContainer}>
            <MaterialIcons name="check-circle" size={24} color={PRIMARY} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalHeaderTitle}>Select Language</Text>
          <View style={styles.placeholder} />
        </View>
        
        {showHeader && (
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Language</Text>
            <Text style={styles.headerSubtitle}>
              Choose your preferred language for the app
            </Text>
          </View>
        )}
        
        <FlatList
          data={SUPPORTED_LANGUAGES}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
        
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <MaterialIcons name="sync" size={24} color={PRIMARY} />
              <Text style={styles.loadingText}>Updating language...</Text>
            </View>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  placeholder: {
    width: 32,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  listContainer: {
    padding: 20,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguageItem: {
    borderColor: PRIMARY,
    backgroundColor: '#F0FDF4',
  },
  languageItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flagContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  selectedLanguageName: {
    color: '#111827',
  },
  languageNativeName: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedLanguageNativeName: {
    color: '#4B5563',
  },
  checkmarkContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 12,
  },
}); 