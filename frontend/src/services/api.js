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

  predictUrl: async (url) => {
    const response = await apiClient.post("/predict", { url });
    return response.data;
  },

  getConfusionMatrixUrl: () => `${API_BASE_URL || ""}/static/model/confusion_matrix.png`,
};

export default apiService;
