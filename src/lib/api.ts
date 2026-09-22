import axios, { AxiosHeaders } from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

        if (token) {
            config.headers = config.headers ?? new AxiosHeaders();
            const headers = config.headers as AxiosHeaders;
            headers.set('Authorization', `Bearer ${token}`);
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401 && typeof window !== 'undefined') {
            localStorage.removeItem('token');
            const redirectUrl = window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';
            window.location.href = redirectUrl;
        }

        return Promise.reject(error);
    }
);

export default api;