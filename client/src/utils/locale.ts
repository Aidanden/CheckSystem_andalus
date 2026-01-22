/**
 * Locale Utilities for Libya
 * إعدادات اللغة والمنطقة الزمنية لليبيا
 */

// Libya Configuration
export const LIBYA_CONFIG = {
  locale: 'en-US', // Use English numerals
  timezone: 'Africa/Tripoli', // Libya timezone (UTC+2)
  currency: 'LYD', // Libyan Dinar
  currencySymbol: 'د.ل', // Libyan Dinar symbol
  country: 'Libya',
  countryCode: 'LY',
};

/**
 * Format date with English numerals
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string with English numerals
 */
export const formatDate = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: LIBYA_CONFIG.timezone,
    ...options,
  };

  return new Intl.DateTimeFormat(LIBYA_CONFIG.locale, defaultOptions).format(dateObj);
};

/**
 * Format date and time with English numerals
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date and time string with English numerals
 */
export const formatDateTime = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24-hour format
    timeZone: LIBYA_CONFIG.timezone,
    ...options,
  };

  return new Intl.DateTimeFormat(LIBYA_CONFIG.locale, defaultOptions).format(dateObj);
};

/**
 * Format time only with English numerals
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted time string with English numerals
 */
export const formatTime = (
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, // 24-hour format
    timeZone: LIBYA_CONFIG.timezone,
    ...options,
  };

  return new Intl.DateTimeFormat(LIBYA_CONFIG.locale, defaultOptions).format(dateObj);
};

/**
 * Format number with English numerals
 * @param num Number to format
 * @param options Intl.NumberFormatOptions
 * @returns Formatted number string with English numerals
 */
export const formatNumber = (
  num: number,
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(LIBYA_CONFIG.locale, options).format(num);
};

/**
 * Format currency in Libyan Dinar with English numerals
 * @param amount Amount to format
 * @param options Intl.NumberFormatOptions
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  options?: Intl.NumberFormatOptions
): string => {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: LIBYA_CONFIG.currency,
    currencyDisplay: 'symbol',
    ...options,
  };

  return new Intl.NumberFormat(LIBYA_CONFIG.locale, defaultOptions).format(amount);
};

/**
 * Format currency with custom symbol (د.ل)
 * @param amount Amount to format
 * @returns Formatted currency string with Libyan Dinar symbol
 */
export const formatLibyanCurrency = (amount: number): string => {
  const formatted = formatNumber(amount, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${LIBYA_CONFIG.currencySymbol}`;
};

/**
 * Get current date/time in Libya timezone
 * @returns Current date in Libya timezone
 */
export const getLibyaTime = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: LIBYA_CONFIG.timezone }));
};

/**
 * Format date for display in tables (short format)
 * @param date Date to format
 * @returns Formatted date string (DD/MM/YYYY)
 */
export const formatDateShort = (date: Date | string | number): string => {
  return formatDate(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Format date for display in tables (medium format)
 * @param date Date to format
 * @returns Formatted date string (DD/MM/YYYY HH:MM)
 */
export const formatDateMedium = (date: Date | string | number): string => {
  return formatDateTime(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date for display in tables (long format)
 * @param date Date to format
 * @returns Formatted date string (DD/MM/YYYY HH:MM:SS)
 */
export const formatDateLong = (date: Date | string | number): string => {
  return formatDateTime(date);
};

/**
 * Convert Arabic numerals to English numerals
 * @param str String containing Arabic numerals
 * @returns String with English numerals
 */
export const arabicToEnglishNumerals = (str: string): string => {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumerals = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  let result = str;
  arabicNumerals.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, 'g'), englishNumerals[index]);
  });
  
  return result;
};

/**
 * Ensure all numerals in string are English
 * @param str String to process
 * @returns String with only English numerals
 */
export const ensureEnglishNumerals = (str: string): string => {
  return arabicToEnglishNumerals(str);
};
