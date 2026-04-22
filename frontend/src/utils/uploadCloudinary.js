// src/utils/uploadCloudinary.js
const cloud_name = (
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ||
  ""
).trim();
const cloud_preset = (
  import.meta.env.VITE_CLOUDINARY_PRESET ||
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  ""
).trim();

const uploadImageToCloudinary = async (file) => {
  if (!cloud_name || !cloud_preset) {
    throw new Error(
      "Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_PRESET.",
    );
  }

  if (!file) {
    throw new Error("No file selected for upload");
  }

  const uploadData = new FormData();
  uploadData.append("file", file);
  uploadData.append("upload_preset", cloud_preset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
    {
      method: "POST",
      body: uploadData,
    }
  );

  let data = null;
  try {
    data = await res.json();
  } catch {
    // Keep `data` null and throw a generic HTTP failure below.
  }

  if (!res.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `Upload failed (HTTP ${res.status})`,
    );
  }

  if (!data?.secure_url) {
    throw new Error("Upload failed: missing secure URL in response");
  }

  return data.secure_url; // only return URL for this use case
};

export default uploadImageToCloudinary;
