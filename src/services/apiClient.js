import axios from 'axios';

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
export const TOKEN_KEY = 'hm_api_token';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    // eslint-disable-next-line no-param-reassign
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setApiToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

export const apiRequest = async (method, url, data) => {
  try {
    const res = await api({ method, url, data });
    return { ok: true, data: res.data };
  } catch (error) {
    const message = error?.response?.data?.message || error.message || 'Không thể kết nối máy chủ.';
    return { ok: false, error: message, raw: error };
  }
};

export default api;
