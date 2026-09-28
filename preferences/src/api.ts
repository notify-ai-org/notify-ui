import { httpService, getPaginated, ApiError as SharedApiError, type PaginatedResponse } from '@notify-ui/shared';

export const CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP', 'PUSH', 'WEBHOOK', 'IN_APP'] as const;
export const channelLabels: Record<string, string> = {
  EMAIL: 'Email', SMS: 'SMS', WHATSAPP: 'WhatsApp', PUSH: 'Push', WEBHOOK: 'Webhook', IN_APP: 'In-app',
};

export type Preference = {
  subjectId: string; optedOut: boolean; optedOutChannels: string[]; preferredChannel: string | null;
  quietHoursStart: string | null; quietHoursEnd: string | null; timeZone: string | null; language: string | null;
  updatedAt: string | null;
};
export type PreferenceInput = Omit<Preference, 'subjectId' | 'updatedAt'>;
export const emptyPreference = (subjectId = ''): Preference => ({
  subjectId, optedOut: false, optedOutChannels: [], preferredChannel: null,
  quietHoursStart: null, quietHoursEnd: null, timeZone: null, language: null, updatedAt: null,
});

/** Suggestions only; any valid BCP 47 tag is accepted by the server. */
export const LANGUAGE_SUGGESTIONS = ['en', 'en-GB', 'es', 'es-MX', 'fr', 'de', 'it', 'pt-BR', 'nl', 'ar', 'hi', 'bn',
  'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'ur', 'zh-CN', 'zh-TW', 'ja', 'ko', 'id', 'th', 'vi', 'tr', 'ru', 'pl', 'sw'];
export function languageLabel(tag: string): string {
  try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(tag) ?? tag; }
  catch { return tag; }
}

export class ApiError extends Error {
  constructor(public status: number, detail?: string) {
    super(status === 401 ? 'Your session has expired. Sign in to continue.'
      : status === 403 ? 'Your account does not have permission for this action.'
      : status === 400 ? detail || 'Check the preferences and try again.'
      : status === 404 ? 'No preferences are recorded for this recipient.'
      : 'The request could not be completed. Please try again.');
  }
}

async function call<T>(run: () => Promise<T>): Promise<T> {
  try { return await run(); }
  catch (error) {
    // Validation messages come from the server; other statuses use fixed copy.
    if (error instanceof SharedApiError) throw new ApiError(error.status, error.message);
    throw error;
  }
}

const base = '/api/admin/recipient-preferences';
export const preferencePath = (subjectId: string) => `${base}/${encodeURIComponent(subjectId)}`;
const options = { errorHandling: 'local' as const };

export const listPreferences = (query: string, page: number, signal?: AbortSignal) =>
  call(() => getPaginated<Preference>(base, { ...options, page, params: { q: query }, signal, ttlMs: 0 }));
export const savePreference = (subjectId: string, body: PreferenceInput) =>
  call(async () => (await httpService.put<Preference>(preferencePath(subjectId), { ...options, data: body, successModal: null })).data);
export const deletePreference = (subjectId: string) =>
  call(async () => { await httpService.delete(preferencePath(subjectId), { ...options, successModal: null }); });

export const errorMessage = (error: unknown) => error instanceof ApiError
  ? error.message : 'Unable to connect. Check your connection and try again.';
export type { PaginatedResponse };
