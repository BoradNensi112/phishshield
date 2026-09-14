import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined 
  ? import.meta.env.VITE_API_BASE_URL 
  : (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export const apiService = {
  getHealth: async () => {
    const response = await apiClient.get("/health");
    return response.data;
  },

  getModelInfo: async () => {
    const response = await apiClient.get("/model-info");
    return response.data;
  },

  getFeatureImportance: async () => {
    const response = await apiClient.get("/feature-importance");
    return response.data;
  },

  predictUrl: async (payload) => {
    const data = typeof payload === "string" ? { url: payload } : payload;
    const response = await apiClient.post("/predict", data);
    return response.data;
  },

  login: async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post("/auth/register", userData);
    return response.data;
  },

  getScans: async (userEmail = null) => {
    const params = userEmail ? { user_email: userEmail } : {};
    const response = await apiClient.get("/scans", { params });
    return response.data;
  },

  // Admin Management Endpoints
  getAdminUsers: async () => {
    const response = await apiClient.get("/api/admin/users");
    return response.data;
  },

  createAdminUser: async (userData) => {
    const response = await apiClient.post("/api/admin/users", userData);
    return response.data;
  },

  updateUserRole: async (email, role) => {
    const response = await apiClient.put(`/api/admin/users/${encodeURIComponent(email)}/role`, { role });
    return response.data;
  },

  updateUserStatus: async (email, status) => {
    const response = await apiClient.put(`/api/admin/users/${encodeURIComponent(email)}/status`, { status });
    return response.data;
  },

  resetUserPassword: async (email, new_password) => {
    const response = await apiClient.put(`/api/admin/users/${encodeURIComponent(email)}/password`, { new_password });
    return response.data;
  },

  deleteUser: async (email) => {
    const response = await apiClient.delete(`/api/admin/users/${encodeURIComponent(email)}`);
    return response.data;
  },

  getAdminScans: async () => {
    const response = await apiClient.get("/api/admin/scans");
    return response.data;
  },

  clearAdminScans: async () => {
    const response = await apiClient.delete("/api/admin/scans");
    return response.data;
  },

  getConfusionMatrixUrl: () => `${API_BASE_URL || ""}/static/model/confusion_matrix.png`,
};

export default apiService;
