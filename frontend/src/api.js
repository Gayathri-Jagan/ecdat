import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecdat_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('ecdat_token');
      localStorage.removeItem('ecdat_user');
      window.dispatchEvent(new Event('ecdat_session_expired'));
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const res = await api.post('/auth/login', { username, password });
  localStorage.setItem('ecdat_token', res.data.token);
  localStorage.setItem('ecdat_user', JSON.stringify(res.data.user));
  return res.data;
};

export const logout = () => {
  localStorage.removeItem('ecdat_token');
  localStorage.removeItem('ecdat_user');
};

export const getCurrentUser = () => {
  const raw = localStorage.getItem('ecdat_user');
  return raw ? JSON.parse(raw) : null;
};

export const isAuthenticated = () => !!localStorage.getItem('ecdat_token');

export const startScan = async (businessCriticality = 'Medium') =>
  (await api.post('/scans/start', { business_criticality: businessCriticality })).data;

export const uploadZipScan = async (file, businessCriticality = 'Medium') => {
  const form = new FormData();
  form.append('file', file);
  form.append('business_criticality', businessCriticality);
  const res = await api.post('/scans/upload-zip', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const gitCloneScan = async (url, businessCriticality = 'Medium') =>
  (await api.post('/scans/git-clone', { url, business_criticality: businessCriticality })).data;

export const containerScan = async (image, businessCriticality = 'Medium') =>
  (await api.post('/scans/container', { image, business_criticality: businessCriticality })).data;
export const getLatestScan = async () => (await api.get('/scans/latest')).data.findings || [];
export const exportCBOM = async () => (await api.post('/cbom/export')).data;
export const getLatestCBOM = async () => (await api.get('/cbom/latest')).data;
export const getAuditLog = async () => (await api.get('/audit')).data.entries || [];

export default api;