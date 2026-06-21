import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bankikhata_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function downloadExport(resource, format) {
  const response = await api.get(`/import-export/${resource}?format=${format}`, {
    responseType: 'blob'
  });
  const url = URL.createObjectURL(response.data);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${resource}.${format}`;
  anchor.click();
  URL.revokeObjectURL(url);
}
