// ponytail: env with hardcoded fallbacks until multi-env configs exist
// trim() so Windows .env CRLF (`1\r`) still enables mock mode
export const MOCK_MODE =
  String(process.env.EXPO_PUBLIC_MOCK_MODE ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '') === '1';

export const API_BASEURL =
  process.env.EXPO_PUBLIC_API_URL || 'https://dev-api.healthtune.io/api';

export const ASSEMBLY_AI_API_KEY =
  process.env.EXPO_PUBLIC_ASSEMBLY_AI_KEY || '';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: 'GB',
    direction: 'ltr',
  },
  {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©',
    flag: 'SA',
    direction: 'rtl',
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'Ø§Ø±Ø¯Ùˆ',
    flag: 'PK',
    direction: 'rtl',
  },
];

export const DEFAULT_LANGUAGE: Language = SUPPORTED_LANGUAGES[0];

export const getLanguageByCode = (code: string): Language => {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code) || DEFAULT_LANGUAGE;
};

