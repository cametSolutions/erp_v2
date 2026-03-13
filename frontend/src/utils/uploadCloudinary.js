// src/utils/uploadCloudinary.js
const cloud_name = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const cloud_preset = import.meta.env.VITE_CLOUDINARY_PRESET;

const uploadImageToCloudinary = async (file) => {
  const uploadData = new FormData();
  uploadData.append("file", file);
  uploadData.append("upload_preset", cloud_preset);
  uploadData.append("cloud_name", cloud_name);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    {
      method: "POST",
      body: uploadData,
    }
  );

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }
  return data.secure_url; // only return URL for this use case
};

export default uploadImageToCloudinary;
