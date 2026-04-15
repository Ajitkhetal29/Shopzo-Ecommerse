import express from "express";
import adminAuth from "../middleware/adminAuth.js";
import {
  createWarehouse,
  getWarehouses,
  updateWarehouse,
  deleteWarehouse,
  addWarehouseMember,
  removeWarehouseMember,
} from "../controllers/warehouse.js";

const warehouseRouter = express.Router();

warehouseRouter.post("/create", adminAuth, createWarehouse);
warehouseRouter.get("/list", adminAuth, getWarehouses);
warehouseRouter.put("/update/:id", adminAuth, updateWarehouse);
warehouseRouter.delete("/delete/:id", adminAuth, deleteWarehouse);
warehouseRouter.post("/:id/members", adminAuth, addWarehouseMember);
warehouseRouter.delete("/:id/members/:memberId", adminAuth, removeWarehouseMember);

export default warehouseRouter;
