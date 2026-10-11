import { DEFAULT_LANGUAGE, Language, SUPPORTED_LANGUAGES, getLanguageByCode } from '@/utils/constants';
import { useUser } from '@/features/auth';
import { useEffect, useState } from 'react';

export const useLanguage = () => {
  const { user } = useUser();
  const [currentLanguage, setCurrentLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const [isLoading, setIsLoading] = useState(false);

  // Get current language from user metadata
  useEffect(() => {
    const currentLanguageCode = user?.unsafeMetadata?.language as string;
    if (currentLanguageCode) {
      const language = getLanguageByCode(currentLanguageCode);
      setCurrentLanguage(language);
    }
  }, [user?.unsafeMetadata?.language]);

  const updateLanguage = async (language: Language) => {
    if (!user || language.code === currentLanguage.code) return;

    setIsLoading(true);
    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          language: language.code,
        }
      });
      setCurrentLanguage(language);
      return true;
    } catch (error) {
      console.error('Error updating language:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLanguageCode = () => currentLanguage.code;
  const getCurrentLanguageName = () => currentLanguage.name;
  const getCurrentLanguageNativeName = () => currentLanguage.nativeName;
  const getCurrentLanguageFlag = () => currentLanguage.flag;
  const getCurrentLanguageDirection = () => currentLanguage.direction;

  return {
    currentLanguage,
    updateLanguage,
    isLoading,
    getCurrentLanguageCode,
    getCurrentLanguageName,
    getCurrentLanguageNativeName,
    getCurrentLanguageFlag,
    getCurrentLanguageDirection,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}; 