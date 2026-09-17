import { httpService, ApiError as SharedApiError } from '@notify-ui/shared';

export type Channel = {
  id: string; type: string; provider: string; credentialType: string; enabled: boolean;
  secretRef: string | null; settings: Record<string, string>; instances: number;
  delay: number; maxAttempts: number; backOffMultiplier: number;
};
export type SecretMetadata = { configured: boolean; provider: string; status: string | null; lastUpdated: string | null; secretRef: string | null };
export function credentialMode(metadata: SecretMetadata | null): 'create' | 'update' | null {
  if (!metadata) return null;
  if (metadata.status === 'ACTIVE') return 'update';
  if (metadata.status === null || metadata.status === 'DELETION_PENDING') return 'create';
  return null;
}
export type Metrics = { since: string; asOf: string; attempts: number; succeeded: number; failed: number; lastAttemptAt: string | null };
export class ApiError extends Error {
  constructor(public status: number, creatingChannel = false) {
    super(status === 409 && creatingChannel ? 'This tenant already has a channel of this type. Open the existing channel to manage its settings and credentials.'
      : status === 401 ? 'Your session has expired. Sign in to continue.'
      : status === 403 ? 'Your account does not have permission for this action.'
      : status === 409 ? 'This action is unavailable in the current channel state. Check the credentials and try again.'
      : status === 400 ? 'Check the settings and required fields, then try again.'
      : status === 404 ? 'Channel management is unavailable, or this channel no longer exists.'
      : 'The request could not be completed. Please try again.');
  }
}

// All channel calls use the shared transport and fresh tenant-scoped data.
export async function request<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const options = { signal, errorHandling: 'local' as const, sensitive: path.includes('/credentials') };
  try {
    if (method === 'GET') return await httpService.get<T>(path, { ...options, ttlMs: 0 });
    const verb = method.toLowerCase() as 'post' | 'put' | 'patch' | 'delete';
    // Allow sequential STS + Secrets Manager calls and database work to finish.
    return (await httpService[verb]<T>(path, { ...options, data: body, successModal: null,
      timeoutMs: options.sensitive ? 60_000 : undefined })).data;
  } catch (error) {
    if (error instanceof SharedApiError) throw new ApiError(error.status, method === 'POST' && path === '/api/v1/channels');
    throw error;
  }
}
export const errorMessage = (error: unknown) => error instanceof ApiError
  ? error.message : 'Unable to connect. Check your connection and try again.';
export const channelPath = (id: string) => `/api/v1/channels/${encodeURIComponent(id)}`;
