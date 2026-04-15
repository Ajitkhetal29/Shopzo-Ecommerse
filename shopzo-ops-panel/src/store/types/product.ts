type ProductCategoryRef = { _id: string; name: string; slug?: string };
type ProductSubcategoryRef = { _id: string; name: string; slug?: string };
type ProductVendorRef = { _id: string; name: string; contactNumber?: string };

export type Product = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  category: ProductCategoryRef;
  subcategory?: ProductSubcategoryRef | null;
  vendor: ProductVendorRef;
  images: { url: string; public_id: string }[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
};


export type ProductVariant = {
  _id: string;
  /** Present when API populates or maps parent id */
  productId?: string;
  product?: string | { _id: string };
  price: number;
  color?: string;
  size?: string;
  sku: string;
  images: { url: string; public_id?: string }[];
};