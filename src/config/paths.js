// Centralized backend URL helpers. Use Vite env variable VITE_API_BASE_URL when available.
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9090';
export const WS_BASE = import.meta.env.VITE_WS_URL || API_BASE;

export function fullUrl(path) {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    if (path.startsWith('/')) return `${API_BASE}${path}`;
    return `${API_BASE}/${path}`;
}

export function profilePictureUrl(url) {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads/')) return `${API_BASE}${url}`;
    return `${API_BASE}/uploads/profile-pictures/${url}`;
}

export default API_BASE;
