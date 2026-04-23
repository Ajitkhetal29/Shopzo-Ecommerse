const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL. Set it in your .env file.");
}
const VENDOR_PRODUCT = `${API_BASE_URL}/vendor/product`;

export const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/vendor/login`,
    LOGOUT: `${API_BASE_URL}/vendor/logout`,

    CURRENT_USER: `${API_BASE_URL}/vendor/me`,

    GET_CATEGORIES: `${API_BASE_URL}/category/list`,
    GET_SUBCATEGORIES: `${API_BASE_URL}/subcategory/list`,
    GET_PRODUCTS: `${VENDOR_PRODUCT}/list`,
    GET_PRODUCT_BY_ID: `${VENDOR_PRODUCT}`,
    CREATE_PRODUCT: `${VENDOR_PRODUCT}/add`,
    UPDATE_PRODUCT: `${VENDOR_PRODUCT}/update`,
    DELETE_PRODUCT: `${VENDOR_PRODUCT}/delete`,
    CREATE_VARIANT: `${VENDOR_PRODUCT}/variants/add`,
    GET_PRODUCT_VARIANTS: `${VENDOR_PRODUCT}/variants/product`,
    GENERATE_UPLOAD_URL: `${API_BASE_URL}/upload/generate-upload-url`,

    UPDATE_VARIANT: `${VENDOR_PRODUCT}/variants/update`,
    DELETE_VARIANT: `${VENDOR_PRODUCT}/variants/delete`,
    GET_VARIANT_BY_ID: `${VENDOR_PRODUCT}/variants`,
    
    INVENTORY_LIST: `${API_BASE_URL}/inventory/list`,
    CREATE_INVENTORY: `${API_BASE_URL}/inventory/create`,
    UPDATE_INVENTORY: `${API_BASE_URL}/inventory/update`,
    DELETE_INVENTORY: `${API_BASE_URL}/inventory/delete`,


    GET_WAREHOUSES: `${API_BASE_URL}/warehouse/list`,



    // inventory transfer
    CREATE_INVENTORY_TRANSFER: `${API_BASE_URL}/inventoryTransfer/create`,
    GET_INVENTORY_TRANSFER_REQUESTS: `${API_BASE_URL}/inventoryTransfer/list`,
    GET_INVENTORY_TRANSFER_REQUEST_BY_ID: `${API_BASE_URL}/inventoryTransfer/getById`,
    UPDATE_INVENTORY_TRANSFER_STATUS: `${API_BASE_URL}/inventoryTransfer/status`,

    // transfer issues
    GET_TRANSFER_ISSUES: `${API_BASE_URL}/transferIssue/list`,
    GET_TRANSFER_ISSUE_BY_ID: `${API_BASE_URL}/transferIssue/getById`,
    UPDATE_TRANSFER_ISSUE_STATUS: `${API_BASE_URL}/transferIssue/status`,
    RESOLVE_TRANSFER_ISSUE: `${API_BASE_URL}/transferIssue/resolve`,
};