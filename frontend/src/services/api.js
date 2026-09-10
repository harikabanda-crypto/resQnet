/**
 * ResQNet Centralized API Client Service
 * Connects frontend to the FastAPI backend with token persistence,
 * error handling, and demo-fallback support.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('resqnet_token') || null;
    this.user = JSON.parse(localStorage.getItem('resqnet_user') || 'null');
  }

  setToken(token, user = null) {
    this.token = token;
    if (token) {
      localStorage.setItem('resqnet_token', token);
    } else {
      localStorage.removeItem('resqnet_token');
    }
    if (user) {
      this.user = user;
      localStorage.setItem('resqnet_user', JSON.stringify(user));
    } else if (!token) {
      this.user = null;
      localStorage.removeItem('resqnet_user');
    }
  }

  getHeaders(isFormData = false) {
    const headers = {};
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const isFormData = options.body instanceof FormData;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(isFormData),
        ...(options.headers || {}),
      },
    };

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, config);
      if (res.status === 401) {
        this.setToken(null, null);
      }
      if (!res.ok) {
        let errMessage = `HTTP error ${res.status}`;
        try {
          const errData = await res.json();
          errMessage = errData.detail || errMessage;
        } catch {
          // Non-JSON error
        }
        throw new Error(errMessage);
      }
      return await res.json();
    } catch (err) {
      console.warn(`[ApiService] Request to ${endpoint} failed:`, err.message);
      throw err;
    }
  }

  // --- Health Check ---
  async checkHealth() {
    return this.request('/health');
  }

  // --- Auth Endpoints ---
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    const data = await this.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    this.setToken(data.access_token, {
      id: data.user_id,
      role: data.role,
      username,
    });
    return data;
  }

  async register(name, email, password, role, phone = null) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role, phone }),
    });
  }

  async getMe() {
    return this.request('/api/auth/me');
  }

  logout() {
    this.setToken(null, null);
  }

  // --- Zones & Risk ---
  async getZones() {
    return this.request('/api/risk/zones');
  }

  async getZone(zoneId) {
    return this.request(`/api/risk/zones/${zoneId}`);
  }

  async getZoneInspection(zoneId) {
    return this.request(`/api/risk/zones/${zoneId}/inspection`);
  }

  async getRiskTrend(zoneId) {
    return this.request(`/api/risk/trend/${zoneId}`);
  }

  async predictRisk(zoneId, overrides = {}) {
    return this.request('/api/predict', {
      method: 'POST',
      body: JSON.stringify({ zone_id: zoneId, ...overrides }),
    });
  }

  // --- Alerts ---
  async getAlerts() {
    return this.request('/api/alerts');
  }

  async createAlert(message, severity = 'high', zoneId = null) {
    return this.request('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({ message, severity, zone_id: zoneId }),
    });
  }

  async updateAlert(alertId, status) {
    return this.request(`/api/alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // --- SOS Requests ---
  async getSOSRequests(status = null) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/api/sos${query}`);
  }

  async getSOS(id) {
    return this.request(`/api/sos/${id}`);
  }

  async createSOS(payload) {
    return this.request('/api/sos', {
      method: 'POST',
      body: JSON.stringify({
        type: payload.type || 'Rescue',
        zone_id: payload.zone || payload.zone_id || 'A17',
        location: payload.location || 'Location Pending',
        people: payload.people || 1,
        priority: payload.priority || 'high',
        description: payload.description || payload.desc || '',
        citizen_name: payload.citizen_name || payload.citizenName || 'Citizen',
      }),
    });
  }

  async updateSOS(id, updates) {
    return this.request(`/api/sos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async assignSOS(id, responderId) {
    return this.request(`/api/sos/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ responder_id: responderId }),
    });
  }

  // --- Infrastructure & Resources ---
  async getShelters() {
    return this.request('/api/shelters');
  }

  async getResources() {
    return this.request('/api/resources');
  }

  async getResponders() {
    return this.request('/api/responders');
  }

  async getBlockages(status = null) {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.request(`/api/blockages${query}`);
  }

  async createBlockage(payload) {
    return this.request('/api/blockages', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateBlockage(id, status, passable = null) {
    const body = { status };
    if (passable !== null) body.passable = passable;
    return this.request(`/api/blockages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // --- Routing Engine ---
  async getSafeRoute(originLat, originLng, destLat, destLng) {
    return this.request('/api/routes/safe', {
      method: 'POST',
      body: JSON.stringify({
        origin_lat: originLat,
        origin_lng: originLng,
        dest_lat: destLat,
        dest_lng: destLng,
      }),
    });
  }

  // --- Community Reports ---
  async getReports() {
    return this.request('/api/reports');
  }

  async createReport(payload) {
    return this.request('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const api = new ApiService();
export default api;
