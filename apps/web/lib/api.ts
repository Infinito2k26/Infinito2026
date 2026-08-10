const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface RequestConfig extends RequestInit {
    // custom configuration
}

class ApiError extends Error {
    status: number;
    data: any;

    constructor(status: number, data: any, message: string) {
        super(message);
        this.status = status;
        this.data = data;
    }
}

async function fetchWrapper(endpoint: string, { method = 'GET', body, headers, ...customConfig }: RequestConfig = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('infinito_token') : null;

    const config: RequestInit = {
        method,
        ...customConfig,
        headers: {
            ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
    };

    if (body && !(body instanceof FormData)) {
        config.body = JSON.stringify(body);
    }

    try {
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

        // other backend errors
        if (!response.ok) {
            throw new ApiError(
                response.status,
                data,
                data?.message || data?.error || 'An unexpected error occurred'
            );
        }

        return data;
    } catch (error: any) {
        if (error instanceof ApiError) {
            throw error;
        }

        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new ApiError(
                503,
                null,
                'Cannot connect to the server. Please ensure the backend is running.'
            );
        }

        throw new ApiError(500, null, 'An unexpected network error occurred.');
    }
}

export const api = {
    get: (endpoint: string, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, method: 'GET' }),
    post: (endpoint: string, body: any, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, body, method: 'POST' }),
    put: (endpoint: string, body: any, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, body, method: 'PUT' }),
    patch: (endpoint: string, body: any, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, body, method: 'PATCH' }),
    delete: (endpoint: string, config?: RequestConfig) => fetchWrapper(endpoint, { ...config, method: 'DELETE' }),
};