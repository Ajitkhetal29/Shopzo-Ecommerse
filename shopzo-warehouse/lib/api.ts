const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api";

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/warehouse/login`,
  LOGOUT: `${API_BASE_URL}/warehouse/logout`,
  CURRENT_USER: `${API_BASE_URL}/warehouse/me`,

// inventory transfer
  GET_INVENTORY_TRANSFER_REQUESTS: `${API_BASE_URL}/inventoryTransfer/list`,
  GET_INVENTORY_TRANSFER_REQUEST_BY_ID: `${API_BASE_URL}/inventoryTransfer/getById`,


// inventory
  GET_INVENTORY: `${API_BASE_URL}/inventory/list`,
};
