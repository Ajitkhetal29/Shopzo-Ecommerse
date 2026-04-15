import Product from "../models/product.js";
import Category from "../models/category.js";
import Subcategory from "../models/subcategory.js";
import Vendor from "../models/vendor.js";
import Variant from "../models/variant.js";
import { uploadImages, deleteImage } from "../utils/cloudinary.js";

const vendorIdFromReq = (req) => req.vendor?.id;

/** Treat missing / other vendor as 404 so we do not leak resource existence */
async function findProductOwnedBy(productId, vendorId) {
  if (!productId || !vendorId) return null;
  const product = await Product.findById(productId);
  if (!product || String(product.vendor) !== String(vendorId)) return null;
  return product;
}

const vendorCreateProduct = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  const { name, description, categoryId, subcategoryId, slug } = req.body;

  try {
    if (!vendorId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const existingVendor = await Vendor.findById(vendorId);
    if (!existingVendor) {
      return res.status(401).json({ success: false, message: "Vendor not found" });
    }

    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        message: "Name and category are required",
      });
    }
    if (!slug) {
      return res.status(400).json({
        success: false,
        message: "Slug could not be generated from name",
      });
    }

    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
      return res.status(400).json({ success: false, message: "Category not found" });
    }

    let subcategory = null;
    if (subcategoryId) {
      const existingSub = await Subcategory.findById(subcategoryId);
      if (!existingSub) {
        return res.status(400).json({ success: false, message: "Subcategory not found" });
      }
      if (String(existingSub.category) !== String(categoryId)) {
        return res.status(400).json({
          success: false,
          message: "Subcategory does not belong to the selected category",
        });
      }
      subcategory = subcategoryId;
    }

    let imageList = [];
    if (req.files?.length) {
      imageList = await uploadImages(req.files);
    }

    const product = new Product({
      name,
      slug,
      description: description ?? "",
      category: categoryId,
      subcategory: subcategory ?? undefined,
      vendor: vendorId,
      images: imageList,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: "Product added successfully",
    });
  } catch (error) {
    console.error("Vendor create product error:", error);
    const isCloudinaryConfig =
      error?.message?.includes("api_key") ||
      error?.message?.includes("Must supply");
    res.status(500).json({
      success: false,
      message: isCloudinaryConfig
        ? "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env"
        : "Something went wrong while adding product.",
    });
  }
};

const vendorListProducts = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const {
      page = 1,
      limit = 20,
      categoryId,
      subcategoryId,
    } = req.query;
    const skip =
      (Math.max(1, parseInt(page, 10)) - 1) *
      Math.min(100, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const filter = { vendor: vendorId };
    if (categoryId) filter.category = categoryId;
    if (subcategoryId) filter.subcategory = subcategoryId;

    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("subcategory", "name slug")
        .populate("vendor", "name contactNumber")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      products,
      totalCount,
      page: parseInt(page, 10),
      limit: limitNum,
    });
  } catch (error) {
    console.error("Vendor list products error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const vendorGetProductById = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  const { id } = req.params;
  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const owned = await findProductOwnedBy(id, vendorId);
    if (!owned) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const productFound = await Product.findById(id)
      .populate("category", "name slug")
      .populate("subcategory", "name slug")
      .populate("vendor", "name");

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product: productFound,
    });
  } catch (error) {
    console.error("Vendor get product error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const vendorDeleteProduct = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  const { id } = req.params;
  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const owned = await findProductOwnedBy(id, vendorId);
    if (!owned) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await Product.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Vendor delete product error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const vendorUpdateProduct = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  const { id } = req.params;
  const { name, description, categoryId, subcategoryId, slug } = req.body;

  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const product = await findProductOwnedBy(id, vendorId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!name || !categoryId || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name, category and slug are required",
      });
    }

    const existingCategory = await Category.findById(categoryId);
    if (!existingCategory) {
      return res.status(400).json({ success: false, message: "Category not found" });
    }

    let subcategory = null;
    if (subcategoryId) {
      const existingSub = await Subcategory.findById(subcategoryId);
      if (!existingSub) {
        return res.status(400).json({
          success: false,
          message: "Subcategory not found",
        });
      }
      if (String(existingSub.category) !== String(categoryId)) {
        return res.status(400).json({
          success: false,
          message: "Subcategory does not belong to the selected category",
        });
      }
      subcategory = subcategoryId;
    }

    product.name = name;
    product.slug = slug.toLowerCase().trim();
    product.description = description ?? "";
    product.category = categoryId;
    product.subcategory = subcategory ?? undefined;
    product.vendor = vendorId;

    let keepIndices = [];
    try {
      if (
        typeof req.body.keepImageIndices === "string" &&
        req.body.keepImageIndices
      ) {
        keepIndices = JSON.parse(req.body.keepImageIndices);
      }
    } catch (_) {}
    const existingList = product.images || [];
    const keptExisting =
      Array.isArray(keepIndices) && keepIndices.length > 0
        ? keepIndices
            .filter(
              (i) => Number.isInteger(i) && i >= 0 && i < existingList.length,
            )
            .map((i) => existingList[i])
        : existingList;
    const newUploads = req.files?.length ? await uploadImages(req.files) : [];
    product.images = [...keptExisting, ...newUploads];

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
    });
  } catch (error) {
    console.error("Vendor update product error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Slug already in use by another product",
      });
    }
    const isCloudinaryConfig =
      error?.message?.includes("api_key") ||
      error?.message?.includes("Must supply");
    return res.status(500).json({
      success: false,
      message: isCloudinaryConfig
        ? "Cloudinary is not configured."
        : "Internal server error",
    });
  }
};

const vendorAddVariant = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const { productId, size, color, price, sku } = req.body;

    if (!productId || !size || !color || !price || !sku) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const product = await findProductOwnedBy(productId, vendorId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let imageList = [];
    if (req.files?.length) {
      imageList = await uploadImages(req.files);
    }

    const newVariant = await Variant.create({
      product: productId,
      size,
      color,
      price,
      sku,
      images: imageList,
    });

    return res.status(201).json({
      success: true,
      message: "Variant created successfully",
      variant: newVariant,
    });
  } catch (error) {
    console.error("Vendor add variant error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while adding variant",
    });
  }
};

const vendorGetProductVariants = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  const { productId } = req.params;
  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "productId is required",
      });
    }

    const owned = await findProductOwnedBy(productId, vendorId);
    if (!owned) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const variants = await Variant.find({ product: productId }).lean();
    return res.status(200).json({
      success: true,
      message: "Variants fetched successfully",
      variants,
    });
  } catch (error) {
    console.error("Vendor get variants error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching variants",
    });
  }
};

const vendorGetVariantById = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  const { id } = req.params;
  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const variant = await Variant.findById(id);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const product = await findProductOwnedBy(variant.product, vendorId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Variant fetched successfully",
      variant,
    });
  } catch (error) {
    console.error("Vendor get variant error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const vendorUpdateVariant = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  const { id } = req.params;
  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const { size, color, price, sku, existingImages } = req.body;

    let parsedExistingImages = [];
    if (existingImages) {
      try {
        parsedExistingImages = JSON.parse(existingImages);
      } catch (_) {
        parsedExistingImages = [];
      }
    }

    let newImageList = [];
    if (req.files?.length) {
      newImageList = await uploadImages(req.files);
    }

    const variant = await Variant.findById(id);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const product = await findProductOwnedBy(variant.product, vendorId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const removedImages = variant.images.filter(
      (img) => !parsedExistingImages.some((e) => e.url === img.url),
    );

    for (const img of removedImages) {
      await deleteImage(img.public_id);
    }

    const finalImages = [...parsedExistingImages, ...newImageList];

    variant.size = size;
    variant.color = color;
    variant.price = price;
    variant.sku = sku;
    variant.images = finalImages;

    await variant.save();

    return res.status(200).json({
      success: true,
      message: "Variant updated successfully",
    });
  } catch (error) {
    console.error("Vendor update variant error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating variant",
    });
  }
};

const vendorDeleteVariant = async (req, res) => {
  const vendorId = vendorIdFromReq(req);
  const { id } = req.params;
  if (!vendorId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const variant = await Variant.findById(id);
    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    const product = await findProductOwnedBy(variant.product, vendorId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    await Variant.findByIdAndDelete(id);
    return res.status(200).json({
      success: true,
      message: "Variant deleted successfully",
    });
  } catch (error) {
    console.error("Vendor delete variant error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export {
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
};
