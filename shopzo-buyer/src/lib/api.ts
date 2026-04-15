const API_BASE_URL = "http://localhost:8000/api";

export const API_ENDPOINTS = {
  /* AUTH */
  REGISTER: `${API_BASE_URL}/auth/buyer/register`,
  LOGIN: `${API_BASE_URL}/auth/buyer/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,

  /* USER */
  CURRENT_USER: `${API_BASE_URL}/me`,

  
};
