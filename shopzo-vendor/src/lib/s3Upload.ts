import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";

type UploadType = "profile" | "product" | "variant";

type UploadExtra = {
  productId?: string;
  sku?: string;
  userId?: string;
};

export async function uploadFilesToS3(files: File[], type: UploadType, extra: UploadExtra = {}) {
  if (!files.length) return [];

  const uploadedUrls: string[] = [];

  for (const file of files) {
    try {
      const { data } = await axios.post(
        API_ENDPOINTS.GENERATE_UPLOAD_URL,
        { fileName: file.name, fileType: file.type, type, ...extra },
        { withCredentials: true },
      );
      
      if (!data?.success) {
        throw new Error(data?.message || "Failed to generate upload URL");
      }

      await axios.put(data.uploadUrl, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });

      uploadedUrls.push(data.fileUrl as string);
    } catch (error) {
      console.error("File upload failed:", error);
    }
  }

  return uploadedUrls;
}

export function uploadProductImagesToS3(files: File[], productId: string) {
  return uploadFilesToS3(files, "product", { productId });
}
