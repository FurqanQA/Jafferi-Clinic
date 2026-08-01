import { logger } from '../shared/logger';

// ============================================================================
// Localization
// Handles multi-language support for notifications
// All implementations are placeholders for future integration
// ============================================================================

/**
 * Supported languages
 */
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  ar: 'Arabic',
  zh: 'Chinese',
  hi: 'Hindi',
  ur: 'Urdu',
  he: 'Hebrew',
  fa: 'Persian',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

/**
 * Translation dictionary interface
 */
export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

/**
 * Translation cache
 */
const translationCache: Map<string, TranslationDictionary> = new Map();

/**
 * Load translations for a language
 */
export async function loadTranslations(language: SupportedLanguage): Promise<TranslationDictionary> {
  // Check cache first
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }

  try {
    // Placeholder for loading translations from file or database
    // In production, this would load from a translation file or API
    const translations = getDefaultTranslations(language);
    translationCache.set(language, translations);
    return translations;
  } catch (error) {
    logger.error('Failed to load translations', { error, language });
    return getDefaultTranslations('en');
  }
}

/**
 * Get default translations for a language
 */
function getDefaultTranslations(language: SupportedLanguage): TranslationDictionary {
  // Placeholder translations - in production, load from translation files
  const baseTranslations: TranslationDictionary = {
    notification: {
      subject: 'Notification',
      body: 'You have a new notification',
      greeting: 'Hello',
      farewell: 'Best regards',
    },
    appointment: {
      reminder: 'Appointment Reminder',
      confirmed: 'Appointment Confirmed',
      cancelled: 'Appointment Cancelled',
      rescheduled: 'Appointment Rescheduled',
    },
    billing: {
      invoice: 'Invoice',
      payment: 'Payment',
      receipt: 'Receipt',
    },
  };

  // Add language-specific overrides
  if (language === 'es') {
    return {
      notification: {
        subject: 'Notificación',
        body: 'Tienes una nueva notificación',
        greeting: 'Hola',
        farewell: 'Saludos cordiales',
      },
      appointment: {
        reminder: 'Recordatorio de Cita',
        confirmed: 'Cita Confirmada',
        cancelled: 'Cita Cancelada',
        rescheduled: 'Cita Reprogramada',
      },
      billing: {
        invoice: 'Factura',
        payment: 'Pago',
        receipt: 'Recibo',
      },
    };
  }

  if (language === 'ar') {
    return {
      notification: {
        subject: 'إشعار',
        body: 'لديك إشعار جديد',
        greeting: 'مرحبا',
        farewell: 'مع أطيب التحيات',
      },
      appointment: {
        reminder: 'تذكير الموعد',
        confirmed: 'تم تأكيد الموعد',
        cancelled: 'تم إلغاء الموعد',
        rescheduled: 'تم إعادة جدولة الموعد',
      },
      billing: {
        invoice: 'فاتورة',
        payment: 'دفع',
        receipt: 'إيصال',
      },
    };
  }

  return baseTranslations;
}

/**
 * Translate a key
 */
export async function translate(
  key: string,
  language: SupportedLanguage = 'en',
  variables?: Record<string, any>
): Promise<string> {
  try {
    const translations = await loadTranslations(language);
    const value = getNestedValue(translations, key);

    if (!value || typeof value !== 'string') {
      logger.warn('Translation key not found', { key, language });
      return key;
    }

    // Replace variables
    if (variables) {
      return replaceVariables(value, variables);
    }

    return value;
  } catch (error) {
    logger.error('Translation error', { error, key, language });
    return key;
  }
}

/**
 * Get nested value from object
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Replace variables in translation string
 */
function replaceVariables(template: string, variables: Record<string, any>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  }
  return result;
}

/**
 * Detect user language from preferences
 */
export function detectUserLanguage(preferences: { language?: string }): SupportedLanguage {
  const language = preferences.language || 'en';
  if (SUPPORTED_LANGUAGES[language as SupportedLanguage]) {
    return language as SupportedLanguage;
  }
  return 'en';
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date, language: SupportedLanguage = 'en'): string {
  try {
    return new Intl.DateTimeFormat(language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch (error) {
    logger.error('Date formatting error', { error, language });
    return date.toISOString();
  }
}

/**
 * Format time according to locale
 */
export function formatTime(date: Date, language: SupportedLanguage = 'en'): string {
  try {
    return new Intl.DateTimeFormat(language, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    logger.error('Time formatting error', { error, language });
    return date.toTimeString();
  }
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  language: SupportedLanguage = 'en'
): string {
  try {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch (error) {
    logger.error('Currency formatting error', { error, language, currency });
    return `${currency} ${amount}`;
  }
}

/**
 * Format number according to locale
 */
export function formatNumber(
  number: number,
  language: SupportedLanguage = 'en'
): string {
  try {
    return new Intl.NumberFormat(language).format(number);
  } catch (error) {
    logger.error('Number formatting error', { error, language });
    return String(number);
  }
}

/**
 * Get text direction for language
 */
export function getTextDirection(language: SupportedLanguage): 'ltr' | 'rtl' {
  const rtlLanguages: SupportedLanguage[] = ['ar', 'ur', 'he', 'fa'];
  return rtlLanguages.includes(language) ? 'rtl' : 'ltr';
}

/**
 * Localize notification content
 */
export async function localizeNotification(
  subject: string,
  body: string,
  language: SupportedLanguage = 'en',
  variables?: Record<string, any>
): Promise<{ subject: string; body: string }> {
  const localizedSubject = await translate(subject, language, variables);
  const localizedBody = await translate(body, language, variables);

  return {
    subject: localizedSubject,
    body: localizedBody,
  };
}

/**
 * Clear translation cache
 */
export function clearTranslationCache(language?: SupportedLanguage): void {
  if (language) {
    translationCache.delete(language);
  } else {
    translationCache.clear();
  }
}

/**
 * Get available languages
 */
export function getAvailableLanguages(): Array<{ code: SupportedLanguage; name: string }> {
  return Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => ({
    code: code as SupportedLanguage,
    name,
  }));
}

/**
 * Validate language code
 */
export function isValidLanguage(code: string): code is SupportedLanguage {
  return code in SUPPORTED_LANGUAGES;
}

/**
 * Get fallback language
 */
export function getFallbackLanguage(language: SupportedLanguage): SupportedLanguage {
  // For now, English is the fallback for all languages
  // In production, this could be more sophisticated
  return 'en';
}
