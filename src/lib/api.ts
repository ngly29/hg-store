import axios from "axios";

// Call api từ Backend
const api = axios.create({
    baseURL: 'http://localhost:8080/api/v1', //process.env.NEXT_PUBLIC_API_URL ||
    headers: {
        'Content-Type': 'application/json',
    }
});
// Đăng ký request interceptor 
api.interceptors.request.use(
    (config) => {
        const token = typeof window !== 'undefined'
                ? localStorage.getItem('token')
                : null;

        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);
// Đăng ký response interceptor
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if(error.response?.status === 401){
            if(typeof window !== 'undefined'){
                localStorage.removeItem('token');
                window.location.href = '/login'; // Chuyển về login của user
            }
        }
        return Promise.reject(error);
    }
)

export default api;