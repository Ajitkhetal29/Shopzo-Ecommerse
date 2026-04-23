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
  UPDATE_INVENTORY_TRANSFER_STATUS: `${API_BASE_URL}/inventoryTransfer/status`,

  // transfer issues
  GET_TRANSFER_ISSUES: `${API_BASE_URL}/transferIssue/list`,
  GET_TRANSFER_ISSUE_BY_ID: `${API_BASE_URL}/transferIssue/getById`,
  UPDATE_TRANSFER_ISSUE_STATUS: `${API_BASE_URL}/transferIssue/status`,
  RESOLVE_TRANSFER_ISSUE: `${API_BASE_URL}/transferIssue/resolve`,


// inventory
  GET_INVENTORY: `${API_BASE_URL}/inventory/list`,
};
