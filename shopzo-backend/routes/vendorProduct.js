import express from "express";
import upload from "../config/multer.js";
import { vendorAuthMiddleware } from "../middleware/auth.js";
import {
  vendorCreateProduct,
  vendorListProducts,
  vendorGetProductById,
  vendorDeleteProduct,
  vendorUpdateProduct,
  vendorAddVariant,
  vendorGetProductVariants,
  vendorGetVariantById,
  vendorUpdateVariant,
  vendorDeleteVariant,
} from "../controllers/vendorProduct.js";

const vendorProductRouter = express.Router();

vendorProductRouter.use(vendorAuthMiddleware);

vendorProductRouter.get("/list", vendorListProducts);
vendorProductRouter.post("/add", upload.array("images", 10), vendorCreateProduct);
vendorProductRouter.delete("/delete/:id", vendorDeleteProduct);
vendorProductRouter.put("/update/:id", upload.array("images", 10), vendorUpdateProduct);

vendorProductRouter.post("/variants/add", upload.array("images", 10), vendorAddVariant);
vendorProductRouter.get("/variants/product/:productId", vendorGetProductVariants);
vendorProductRouter.get("/variants/:id", vendorGetVariantById);
vendorProductRouter.put("/variants/update/:id", upload.array("images", 10), vendorUpdateVariant);
vendorProductRouter.delete("/variants/delete/:id", vendorDeleteVariant);

/** Must be after /variants/* and /delete/:id /update/:id */
vendorProductRouter.get("/:id", vendorGetProductById);

export default vendorProductRouter;
