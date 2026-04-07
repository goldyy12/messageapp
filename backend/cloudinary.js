import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Cloudinary automatically looks for process.env.CLOUDINARY_URL
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "chat_uploads",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "pdf"],
  },
});

// Use 'export' instead of 'module.exports'
export { cloudinary, storage };
