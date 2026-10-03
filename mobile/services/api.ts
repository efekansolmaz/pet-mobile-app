import { API_PREFIX, API_URL } from '@/constants/api';
import { refreshAccessToken, useAuthStore } from '@/stores/auth';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data.detail === 'string') return data.detail;
    return 'Something went wrong. Please try again.';
  } catch {
    return 'Unable to reach PetCare right now.';
  }
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const token = useAuthStore.getState().accessToken;
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_PREFIX}${path}`, { ...init, headers });
  if (response.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return api<T>(path, init, false);
    }
  }
  if (!response.ok) {
    throw new ApiError(await parseError(response), response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
}

export const endpoints = {
  register: (body: object) => api('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: object) => api('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => api('/auth/me'),
  updateMe: (body: object) => api('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),
  pets: () => api('/pets'),
  createPet: (body: object) => api('/pets', { method: 'POST', body: JSON.stringify(body) }),
  getPet: (id: string) => api(`/pets/${id}`),
  updatePet: (id: string, body: object) => api(`/pets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePet: (id: string) => api(`/pets/${id}`, { method: 'DELETE' }),
  dashboard: (id: string) => api(`/pets/${id}/dashboard`),
  passport: (id: string) => api(`/pets/${id}/passport`),
  list: (id: string, resource: string) => api(`/pets/${id}/${resource}`),
  create: (id: string, resource: string, body: object) =>
    api(`/pets/${id}/${resource}`, { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, resource: string, itemId: string, body: object) =>
    api(`/pets/${id}/${resource}/${itemId}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id: string, resource: string, itemId: string) =>
    api(`/pets/${id}/${resource}/${itemId}`, { method: 'DELETE' }),
  allReminders: () => api('/reminders'),
  chat: (body: object) => api('/ai/chat', { method: 'POST', body: JSON.stringify(body) }),
};
