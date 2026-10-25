export interface SavedBrowserSession {
  id: string;
  title: string;
  tabs: Array<{ title: string; url: string; pinned: boolean; active: boolean }>;
  createdAt: string;
}
export const SESSION_KEY: string;
export function normalizeSession(value: unknown): SavedBrowserSession | null;
export function normalizeSessions(value: unknown): SavedBrowserSession[];
