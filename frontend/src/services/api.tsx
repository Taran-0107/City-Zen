import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://city-zen.onrender.com/';

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;