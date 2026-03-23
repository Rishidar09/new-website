const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return '/api';
};

const API_URL = getBaseUrl();

const parseResponse = async (res) => {
    const raw = await res.text();
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return { error: raw };
    }
};

const getHeaders = (body) => {
    const token = localStorage.getItem('token');
    const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    // Only set Content-Type if it's not FormData
    // Browser automatically sets Content-Type for FormData with boundary
    if (!(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    return headers;
};

export const api = {
    get: async (endpoint) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: getHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        return data;
    },

    post: async (endpoint, body) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(body),
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
        const data = await parseResponse(res);
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        return data;
    },

    patch: async (endpoint, body) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PATCH',
            headers: getHeaders(body),
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
        const data = await parseResponse(res);
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        return data;
    },

    put: async (endpoint, body) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'PUT',
            headers: getHeaders(body),
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
        const data = await parseResponse(res);
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        return data;
    },

    delete: async (endpoint) => {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        const data = await parseResponse(res);
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        return data;
    }
};
