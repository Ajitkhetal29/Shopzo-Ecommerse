import express from "express";
import upload from "../config/multer.js";
import { createProduct, getProducts, deleteProduct, getProductById, updateProduct , addVariant, getProductvariants,
    getVariantById, updateVariant, deleteVariant
} from "../controllers/product.js";

const productRouter = express.Router();

productRouter.get("/list",  getProducts);
productRouter.post("/add",  upload.array("images", 10), createProduct);
productRouter.delete("/delete/:id",  deleteProduct);
productRouter.get("/:id",  getProductById);
productRouter.put("/update/:id",  upload.array("images", 10), updateProduct);
productRouter.post("/variants/add",  upload.array("images", 10), addVariant);
productRouter.get("/variants/:id",  getVariantById);
productRouter.put("/variants/update/:id",  upload.array("images", 10), updateVariant);
productRouter.delete("/variants/delete/:id",  deleteVariant);
productRouter.get("/variants/product/:productId", getProductvariants);


export default productRouter;
