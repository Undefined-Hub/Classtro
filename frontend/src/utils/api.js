import axios from 'axios';
const baseURL = import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';
const token= localStorage.getItem('accessToken');
const api = axios.create({
    baseURL: baseURL,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    },
});

export default api;