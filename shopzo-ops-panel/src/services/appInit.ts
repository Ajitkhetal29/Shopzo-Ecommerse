import axios from "axios";
import { store } from "@/store";
import { setUser } from "@/store/slices/authSlice";
import { setWarehouses } from "@/store/slices/warehouseSlice";
import { setUsers } from "@/store/slices/userSlice";
import { setDashboardStats } from "@/store/slices/dashboardStats";
import { setVendors } from "@/store/slices/vendorSlice";
import { API_ENDPOINTS } from "@/lib/api";
import { setDepartments, setRoles } from "@/store/slices/genralSlice";

export interface AppInitResult {
  success: boolean;
  error?: string;
}

/**
 * Initializes app data on startup
 * Fetches current user, warehouses, and users
 */
export const initializeApp = async (): Promise<AppInitResult> => {
  try {
    const dispatch = store.dispatch;
    let state = store.getState();
    let isAuthenticated = Boolean(state.auth.isAuthenticated && state.auth.user);

    // First, resolve auth. If not logged in, skip protected startup fetches.
    if (!isAuthenticated) {
      try {
        const res = await axios.get(API_ENDPOINTS.CURRENT_USER, { withCredentials: true });
        if (res.data.success && res.data.user) {
          dispatch(setUser(res.data.user));
          isAuthenticated = true;
        }
      } catch {
        return { success: true };
      }
    }

    if (!isAuthenticated) {
      return { success: true };
    }

    state = store.getState();

    // Only fetch if data is not already in Redux
    const promises: Promise<any>[] = [];

    // Fetch warehouses if not in Redux
    if (!state.warehouse.warehouses || state.warehouse.warehouses.length === 0) {
      promises.push(
        axios
          .get(API_ENDPOINTS.GET_WAREHOUSES, { withCredentials: true })
          .then((res) => {
            if (res.data.success && res.data.warehouses) {
              dispatch(setWarehouses(res.data.warehouses));
            }
          })
          .catch((err) => {
            console.error("Error fetching warehouses:", err);
          })
      );
    }

    // Fetch users if not in Redux
    if (!state.user.users || state.user.users.length === 0) {
      promises.push(
        axios
          .get(API_ENDPOINTS.GET_OPS_USERS, { withCredentials: true })
          .then((res) => {
            if (res.status === 200 && res.data.users) {
              dispatch(setUsers(res.data.users));
            }
          })
          .catch((err) => {
            console.error("Error fetching users:", err);
          })
      );
    }

    // Fetch vendors if not in Redux
    if (!state.vendor.vendors || state.vendor.vendors.length === 0) {
      promises.push(
        axios
          .get(API_ENDPOINTS.GET_VENDORS, { withCredentials: true })
          .then((res) => {
            if (res.data.success && res.data.vendors) {
              dispatch(setVendors(res.data.vendors));
            }
          })
          .catch((err) => {
            console.error("Error fetching vendors:", err);
          })
      );
    }

    // general
    if (!state.general.departments || state.general.departments.length === 0) {
      promises.push(
        axios
          .get(API_ENDPOINTS.GET_DEPARTMENTS, { withCredentials: true })
          .then((res) => {
            if (res.data.success && res.data.departments) {
              dispatch(setDepartments(res.data.departments));
            }
          })
          .catch((err) => {
            console.error("Error fetching departments:", err);
          })
      );
    }

    if (!state.general.roles || state.general.roles.length === 0) {
      promises.push(
        axios
          .get(API_ENDPOINTS.GET_ROLES, { withCredentials: true })
          .then((res) => {
            if (res.data.success && res.data.roles) {
              dispatch(setRoles(res.data.roles));
            }
          })
          .catch((err) => {
            console.error("Error fetching roles:", err);
          })
      );
    }

    if (!state.dashboardStats || state.dashboardStats.totalUsers === 0) {
    promises.push(
      axios
        .get(API_ENDPOINTS.GET_DASHBOARD_STATS, { withCredentials: true })
        .then((res) => {
          if (res.data.success && res.data.stats) {
            dispatch(setDashboardStats(res.data.stats));
          }
        })
        .catch((err) => {
          console.error("Error fetching dashboard stats:", err);
        })
    );
  }
    
  
    // Wait for all fetches to complete
    await Promise.allSettled(promises);

    return { success: true };
  } catch (error: any) {
    console.error("Error initializing app:", error);
    return {
      success: false,
      error: error.message || "Failed to initialize app",
    };
  }
};
