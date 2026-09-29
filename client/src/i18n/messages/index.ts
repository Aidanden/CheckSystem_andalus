import type { Locale } from '../config';
import ar from './ar';
import en from './en';
import type { Messages } from './en';

export const messages: Record<Locale, Messages> = { ar, en };

export type { Messages };
