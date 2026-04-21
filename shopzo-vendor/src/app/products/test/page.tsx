"use client";

import { useState } from "react";
import axios from "axios";
import { API_ENDPOINTS } from "@/app/lib/api";

// test page to test the s3 upload


const TestPage = () => {


    const [images, setImages] = useState<File[]>([]);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [hasUploaded, setHasUploaded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        setImages(Array.from(e.target.files));
        setImageUrls([]);
        setHasUploaded(false);
    };

    const handleRemoveImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };


    const getUploadUrl = async (file: File) => {

        const { data } = await axios.post(API_ENDPOINTS.GENERATE_UPLOAD_URL, {
            fileName: file.name,
            fileType: file.type,
            type: "product",
            productId: "123",
        }, { withCredentials: true });


        if (data.success) {
            const uploadUrl = data.uploadUrl;
            const fileUrl = data.fileUrl;
            const key = data.key;
            console.log("uploadUrl", uploadUrl);
            console.log("fileUrl", fileUrl);
            console.log("key", key);
            return { uploadUrl, fileUrl, key };
        } else {
            console.log(data.message);
            return null;
        }
    };


    const uploadImage = async (uploadUrl: string, file: File) => {
        const res = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
        });

        if (!res.ok) {
            return { success: false };
        }

        console.log("Image uploaded successfully");
        return { success: true };
    };


    const handleSubmit = async () => {
        if (!images.length) return;

        setIsUploading(true);
        try {
            const uploadedUrls = await Promise.all(
                images.map(async (image) => {
                    const result = await getUploadUrl(image);
                    if (!result) return null;

                    const { uploadUrl, fileUrl } = result;
                    const uploadResult = await uploadImage(uploadUrl, image);
                    if (!uploadResult.success) return null;

                    return fileUrl;
                }),
            );

            const successUrls = uploadedUrls.filter((url): url is string => Boolean(url));
            setImageUrls(successUrls);
            setHasUploaded(true);
            console.log(successUrls);
        } catch (error) {
            console.log(error);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <h1>Test Page</h1>

            <input type="file" multiple onChange={handleFileChange} />


            {/* need to show the files as oject url*/}
            <div className="flex flex-wrap gap-2 mt-4">

                {images.map((image, index) => (
                    <div key={image.name} className="flex flex-col items-center justify-center" >
                        <button onClick={() => handleRemoveImage(index)} className="bg-red-500 text-white p-2 rounded-md">Remove</button>
                        <p>{image.name}</p>
                        <img src={URL.createObjectURL(image)} alt={image.name} className="w-20 h-20 object-cover" />
                    </div>
                ))}
            </div>

           {!hasUploaded && (
             <button
               onClick={handleSubmit}
               disabled={isUploading || images.length === 0}
               className="bg-blue-500 text-white p-2 rounded-md disabled:opacity-50"
             >
               {isUploading ? "Uploading..." : "Upload Images"}
             </button>
           )}

            {hasUploaded && (
                <div className="flex flex-col items-center justify-center mt-4">
                    <h2>Uploaded Images</h2>
                    <div className="flex flex-wrap gap-2">
                      {imageUrls.length > 0 && imageUrls.map((imageUrl) => (
                        <img key={imageUrl} src={imageUrl} alt="Uploaded Image" className="w-20 h-20 object-cover" />
                      ))}
                      {imageUrls.length === 0 && <p>No images uploaded</p>}
                    </div>
                </div>
            )}
        </div>

                
    );
};

export default TestPage;