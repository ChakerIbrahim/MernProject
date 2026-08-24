import axios from 'axios';
import { getToken } from './auth';
import { API_ORIGIN } from './backendUrl';

const api = axios.create({
    baseURL: API_ORIGIN,
    withCredentials: true
});

api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
