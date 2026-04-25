const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL. Set it in your .env file.");
}

export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/warehouse/login`,
  LOGOUT: `${API_BASE_URL}/warehouse/logout`,
  CURRENT_USER: `${API_BASE_URL}/warehouse/me`,

// inventory transfer
  GET_INVENTORY_TRANSFER_REQUESTS: `${API_BASE_URL}/inventoryTransfer/list`,
  GET_INVENTORY_TRANSFER_REQUEST_BY_ID: `${API_BASE_URL}/inventoryTransfer/getById`,
  GET_INVENTORY_TRANSFER_STATUS_RULES: `${API_BASE_URL}/inventoryTransfer/status-rules`,
  UPDATE_INVENTORY_TRANSFER_STATUS: `${API_BASE_URL}/inventoryTransfer/status`,
  COMPLETE_INVENTORY_TRANSFER: `${API_BASE_URL}/inventoryTransfer/complete`,
  ISSUE_REPORT_INVENTORY_TRANSFER: `${API_BASE_URL}/inventoryTransfer/issue-report`,
  GET_TRANSFER_ISSUES: `${API_BASE_URL}/inventoryTransfer/issues`,


// inventory
  GET_INVENTORY: `${API_BASE_URL}/inventory/list`,
};
