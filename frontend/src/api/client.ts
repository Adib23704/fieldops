import type {
  AiTriageLog,
  Customer,
  OrderStatus,
  Technician,
  TriageMetrics,
  TriageResult,
  User,
  WorkOrder,
  WorkOrderItem,
} from '../types';

const getApiBase = (): string => {
  if (typeof window === 'undefined') {
    return `${process.env.BACKEND_URL || 'http://127.0.0.1:5000'}/api/v1`;
  }
  return '/api/v1';
};

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('fieldops_token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('fieldops_token', token);
};

export const clearToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('fieldops_token');
};

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${getApiBase()}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error?.message || `HTTP ${response.status} Error`;
    throw new ApiError(message, response.status, data?.error?.code, data?.error?.details);
  }

  return data.data as T;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiRequest<{ token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => apiRequest<{ user: User }>('/auth/me'),
  },

  workOrders: {
    list: (params?: {
      status?: string;
      priority?: string;
      technicianId?: number;
      customerId?: number;
      search?: string;
      page?: number;
      limit?: number;
    }) => {
      const query = new URLSearchParams();
      if (params) {
        for (const [key, val] of Object.entries(params)) {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, String(val));
          }
        }
      }
      return apiRequest<{
        items: WorkOrder[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`/work-orders?${query.toString()}`);
    },

    get: (id: number) => apiRequest<WorkOrder>(`/work-orders/${id}`),

    create: (data: {
      customerId: number;
      title: string;
      description: string;
      category: string;
      priority?: string;
      technicianId?: number | null;
      scheduledStart?: string | null;
      scheduledEnd?: string | null;
    }) =>
      apiRequest<WorkOrder>('/work-orders', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (
      id: number,
      data: {
        customerId?: number;
        title?: string;
        description?: string;
        category?: string;
        priority?: string;
        technicianId?: number | null;
        scheduledStart?: string | null;
        scheduledEnd?: string | null;
      }
    ) =>
      apiRequest<WorkOrder>(`/work-orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    updateStatus: (
      id: number,
      data: {
        status: OrderStatus;
        reason?: string;
        technicianId?: number | null;
        scheduledStart?: string | null;
        scheduledEnd?: string | null;
      }
    ) =>
      apiRequest<WorkOrder>(`/work-orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),

    addItem: (
      id: number,
      data: {
        type: 'PART' | 'LABOR';
        description: string;
        quantity: number;
        unitPrice: number;
      }
    ) =>
      apiRequest<{
        item: WorkOrderItem;
        totals: { subtotal: number; taxAmount: number; totalAmount: number };
      }>(`/work-orders/${id}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    deleteItem: (orderId: number, itemId: number) =>
      apiRequest<{
        deletedItemId: number;
        totals: { subtotal: number; taxAmount: number; totalAmount: number };
      }>(`/work-orders/${orderId}/items/${itemId}`, {
        method: 'DELETE',
      }),
  },

  customers: {
    list: (search?: string) => {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      return apiRequest<Customer[]>(`/customers${q}`);
    },
    get: (id: number) => apiRequest<Customer>(`/customers/${id}`),
    create: (data: {
      name: string;
      companyName?: string;
      email?: string;
      phone: string;
      address: string;
      city: string;
      postalCode?: string;
    }) =>
      apiRequest<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      id: number,
      data: {
        name?: string;
        companyName?: string;
        email?: string;
        phone?: string;
        address?: string;
        city?: string;
        postalCode?: string;
      }
    ) =>
      apiRequest<Customer>(`/customers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  technicians: {
    list: (includeInactive = false) =>
      apiRequest<Technician[]>(
        `/users/technicians${includeInactive ? '?includeInactive=true' : ''}`
      ),
    create: (data: {
      fullName: string;
      email: string;
      phone: string;
      password: string;
      skillCategories?: string[];
      isActive?: boolean;
    }) =>
      apiRequest<Technician>('/users/technicians', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (
      id: number,
      data: {
        fullName?: string;
        email?: string;
        phone?: string;
        password?: string;
        skillCategories?: string[];
        isActive?: boolean;
      }
    ) =>
      apiRequest<Technician>(`/users/technicians/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  ai: {
    triage: (data: { description: string; categoryHint?: string; workOrderId?: number }) =>
      apiRequest<TriageResult>('/ai/triage', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    metrics: () => apiRequest<TriageMetrics>('/ai/metrics'),

    logs: (limit = 20) => apiRequest<AiTriageLog[]>(`/ai/logs?limit=${limit}`),

    evaluate: (id: number, overrideUrgency: string) =>
      apiRequest<AiTriageLog>(`/ai/logs/${id}/evaluate`, {
        method: 'PATCH',
        body: JSON.stringify({ overrideUrgency }),
      }),
  },
};
