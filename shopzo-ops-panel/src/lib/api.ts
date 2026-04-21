const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL. Set it in your .env file.");
}

export const API_ENDPOINTS = {
  // auth

  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  CURRENT_USER: `${API_BASE_URL}/me`,

  
  // dashboard stats
  GET_DASHBOARD_STATS: `${API_BASE_URL}/dashboard/stats`,





  // warehouse

  CREATE_WAREHOUSES: `${API_BASE_URL}/warehouse/create`,
  GET_WAREHOUSES: `${API_BASE_URL}/warehouse/list`,
  UPDATE_WAREHOUSES: `${API_BASE_URL}/warehouse/update`, // :id
  DELETE_WAREHOUSES: `${API_BASE_URL}/warehouse/delete`, // :id


  // users
  GET_OPS_USERS: `${API_BASE_URL}/user/list`,
  CREATE_OPS_USER: `${API_BASE_URL}/user/create`,
  UPDATE_OPS_USER: `${API_BASE_URL}/user/update`, // :id
  DELETE_OPS_USER: `${API_BASE_URL}/user/delete`, // :id
  GET_ALL_USERS_WITH_ROLE_AND_DEPARTMENT: `${API_BASE_URL}/user/all`, // New endpoint to get all users with role and department details  

  // departments
  GET_DEPARTMENTS: `${API_BASE_URL}/department/list`,
  CREATE_DEPARTMENT: `${API_BASE_URL}/department/create`,
  UPDATE_DEPARTMENT: `${API_BASE_URL}/department/update`, // :id
  DELETE_DEPARTMENT: `${API_BASE_URL}/department/delete`, // :id
  GET_DEPARTMENT_BY_ID: `${API_BASE_URL}/department`,  // get by id




  // roles
  GET_ROLES: `${API_BASE_URL}/role/list`,
  CREATE_ROLE: `${API_BASE_URL}/role/create`,
  UPDATE_ROLE: `${API_BASE_URL}/role/update`, // :id
  DELETE_ROLE: `${API_BASE_URL}/role/delete`, // :id
  GET_ROLE_BY_ID: `${API_BASE_URL}/role`,  // get by id



  // vendor
  GET_VENDORS: `${API_BASE_URL}/vendor/list`,
  CREATE_VENDOR: `${API_BASE_URL}/vendor/create`,
  UPDATE_VENDOR: `${API_BASE_URL}/vendor/update`, // :id
  DELETE_VENDOR: `${API_BASE_URL}/vendor/delete`, // :id
  GET_VENDOR_BY_ID: `${API_BASE_URL}/vendor`,  // get by id



  GET_REPORTING : `${API_BASE_URL}/user-reporting/list`,
  CREATE_REPORTING : `${API_BASE_URL}/user-reporting/create`,
  CHECK_REPORTING : `${API_BASE_URL}/user-reporting/check`,
  UPDATE_REPORTING : `${API_BASE_URL}/user-reporting/update`, // :id
  DELETE_REPORTING : `${API_BASE_URL}/user-reporting/delete`, // :id




  // categories
  GET_CATEGORIES: `${API_BASE_URL}/category/list`,
  CREATE_CATEGORY: `${API_BASE_URL}/category/create`,
  DELETE_CATEGORY: `${API_BASE_URL}/category/delete`, // :id
  UPDATE_CATEGORY: `${API_BASE_URL}/category/update`, // :id

  // subcategories
  GET_SUBCATEGORIES: `${API_BASE_URL}/subcategory/list`,
  CREATE_SUBCATEGORY: `${API_BASE_URL}/subcategory/create`,
  DELETE_SUBCATEGORY: `${API_BASE_URL}/subcategory/delete`, // :id
  UPDATE_SUBCATEGORY: `${API_BASE_URL}/subcategory/update`, // :id

  // product
  GET_PRODUCTS: `${API_BASE_URL}/product/list`,
  GET_PRODUCT_BY_ID: `${API_BASE_URL}/product`, // GET /:id
  CREATE_PRODUCT: `${API_BASE_URL}/product/add`,
  DELETE_PRODUCT: `${API_BASE_URL}/product/delete`, // :id
  UPDATE_PRODUCT: `${API_BASE_URL}/product/update`, // :id
  CREATE_VARIANT: `${API_BASE_URL}/product/variants/add`,
  GET_PRODUCT_VARIANTS: `${API_BASE_URL}/product/variants/product`, // GET /:productId
  UPDATE_VARIANT: `${API_BASE_URL}/product/variants/update`, // :id
  DELETE_VARIANT: `${API_BASE_URL}/product/variants/delete`, // :id
  GET_VARIANT_BY_ID: `${API_BASE_URL}/product/variants`, // GET /:id
  GENERATE_UPLOAD_URL: `${API_BASE_URL}/upload/generate-upload-url`,

};
