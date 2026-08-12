import { getPersistedToken } from './storage';

export const API_BASE_URL = 'https://api.monkeyautospa.com.mx';

let inMemoryToken: string | null = null;

export function setApiToken(token: string | null) {
  inMemoryToken = token;
}

export function getApiToken(): string | null {
  return inMemoryToken;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = inMemoryToken || (await getPersistedToken());

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = Array.isArray(data?.message)
      ? data.message.join(', ')
      : data?.message || data?.error || `Error ${response.status}`;
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

// ── Auth Endpoints ─────────────────────────────────────────────────────────────

export interface ApiAuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'washer' | 'client';
    phone?: string;
    pickupPerson?: string;
    address?: string;
    notes?: string;
  };
}

export async function loginApi(email: string, password: string): Promise<ApiAuthResponse> {
  const res = await request<ApiAuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.token) setApiToken(res.token);
  return res;
}

export async function registerApi(name: string, email: string, password: string, phone?: string): Promise<ApiAuthResponse> {
  const res = await request<ApiAuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone }),
  });
  if (res.token) setApiToken(res.token);
  return res;
}

export async function googleLoginApi(credential: string): Promise<ApiAuthResponse> {
  const res = await request<ApiAuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
  if (res.token) setApiToken(res.token);
  return res;
}

export async function getMeApi(): Promise<ApiAuthResponse['user']> {
  return request<ApiAuthResponse['user']>('/auth/me', {
    method: 'GET',
  });
}

export async function updateMeApi(data: { name?: string; phone?: string; pickupPerson?: string; address?: string; notes?: string }): Promise<ApiAuthResponse['user']> {
  return request<ApiAuthResponse['user']>('/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function logoutApi(): Promise<{ message?: string }> {
  try {
    return await request<{ message?: string }>('/auth/logout', {
      method: 'POST',
    });
  } finally {
    setApiToken(null);
  }
}

// ── Vehicles Endpoints ─────────────────────────────────────────────────────────

export interface ApiVehicle {
  _id: string;
  plate?: string;
  make: string;
  model?: string;
  color?: string;
  year?: string;
  vehicleType?: 'small' | 'medium' | 'large' | 'motorcycle' | 'trailer';
  imageUri?: string;
}

export async function getVehiclesApi(): Promise<ApiVehicle[]> {
  return request<ApiVehicle[]>('/me/vehicles', {
    method: 'GET',
  });
}

export async function addVehicleApi(data: Omit<ApiVehicle, '_id'>): Promise<ApiVehicle> {
  return request<ApiVehicle>('/me/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateVehicleApi(id: string, data: Partial<ApiVehicle>): Promise<ApiVehicle> {
  return request<ApiVehicle>(`/me/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteVehicleApi(id: string): Promise<{ message?: string }> {
  return request<{ message?: string }>(`/me/vehicles/${id}`, {
    method: 'DELETE',
  });
}

// ── Settings Endpoints ─────────────────────────────────────────────────────────

export interface ApiSettings {
  catalog: Record<string, Array<{ id: string; name: string; price: number | string; durationMinutes?: number; duration?: string; description?: string[] }>>;
  booking: {
    slots: string[];
    daysAhead: number;
    slotCapacity: number;
  };
}

export async function getSettingsApi(): Promise<ApiSettings> {
  return request<ApiSettings>('/settings', {
    method: 'GET',
  });
}

// ── Appointments Endpoints ─────────────────────────────────────────────────────

export interface ApiAvailabilitySlot {
  time: string;
  taken: number;
  capacity: number;
  available: boolean;
}

export async function getAvailabilityApi(date: string): Promise<ApiAvailabilitySlot[]> {
  return request<ApiAvailabilitySlot[]>(`/appointments/availability?date=${encodeURIComponent(date)}`, {
    method: 'GET',
  });
}

export interface CreateAppointmentInput {
  packageId: string;
  date: string;
  time: string;
  customer?: {
    name?: string;
    phone?: string;
    pickupPerson?: string;
  };
  vehicle: {
    plate?: string;
    make: string;
    model?: string;
    color?: string;
    year?: string;
    vehicleType?: string;
  };
  notes?: string;
}

export interface ApiAppointment {
  _id: string;
  code: string;
  packageId: string;
  packageName: string;
  price: number;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'ready_for_pickup' | 'completed' | 'cancelled';
  client?: {
    id?: string;
    name?: string;
    phone?: string;
  };
  vehicle: {
    plate?: string;
    make?: string;
    model?: string;
    color?: string;
    year?: string;
    vehicleType?: string;
  };
  notes?: string;
  washerName?: string;
}

export async function createAppointmentApi(data: CreateAppointmentInput): Promise<ApiAppointment> {
  return request<ApiAppointment>('/appointments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getAppointmentsApi(params?: {
  status?: string;
  date?: string;
  active?: boolean;
}): Promise<ApiAppointment[]> {
  let query = '';
  if (params) {
    const qp = new URLSearchParams();
    if (params.status) qp.append('status', params.status);
    if (params.date) qp.append('date', params.date);
    if (params.active !== undefined) qp.append('active', String(params.active));
    query = `?${qp.toString()}`;
  }
  return request<ApiAppointment[]>(`/appointments${query}`, {
    method: 'GET',
  });
}

export async function updateAppointmentStatusApi(id: string, status: string): Promise<ApiAppointment> {
  return request<ApiAppointment>(`/appointments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

// ── QR / Washer Scanner Endpoints ──────────────────────────────────────────────

export interface ApiCodeResolution {
  appointment: ApiAppointment;
  allowedActions: ('take' | 'finish' | 'deliver')[];
  nextStatus: string;
}

export async function resolveCodeApi(code: string): Promise<ApiCodeResolution> {
  return request<ApiCodeResolution>(`/appointments/code/${encodeURIComponent(code)}`, {
    method: 'GET',
  });
}

export async function advanceCodeApi(code: string): Promise<ApiAppointment> {
  return request<ApiAppointment>(`/appointments/code/${encodeURIComponent(code)}/advance`, {
    method: 'POST',
  });
}
