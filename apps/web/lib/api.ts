const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

type RequestConfig = Omit<RequestInit, 'body'> & { body?: unknown };

export class ApiError extends Error {
    status: number;
    data: unknown;

    constructor(status: number, data: unknown, message: string) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function fetchWrapper(endpoint: string, { method = 'GET', body, headers, ...customConfig }: RequestConfig = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('infinito_token') : null;

    const config: RequestInit = {
        method,
        // The refresh-token cookie only travels cross-origin (web and api run
        // on separate ports in dev) if credentials are explicitly included.
        credentials: 'include',
        ...customConfig,
        headers: {
            ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    };

    if (body && !(body instanceof FormData)) {
        config.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
        config.body = body;
    }

    // snd request
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (response.status === 204) return null;

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('infinito_token');
            // Force redirect
            window.location.href = '/login';
        }
        throw new ApiError(401, data, 'Session expired. Please log in again.');
    }

    // other backend errors — matches the error envelope { success: false, error: { code, message, details } }
    if (!response.ok) {
        throw new ApiError(
            response.status,
            data,
            data?.error?.message || 'An unexpected error occurred'
        );
    }

    return data;
}

export const api = {
    get: (endpoint: string, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, method: 'GET' }),
    post: (endpoint: string, body: unknown, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, body, method: 'POST' }),
    put: (endpoint: string, body: unknown, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, body, method: 'PUT' }),
    patch: (endpoint: string, body: unknown, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, body, method: 'PATCH' }),
    delete: (endpoint: string, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, method: 'DELETE' }),
};