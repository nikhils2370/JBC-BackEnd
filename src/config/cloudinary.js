const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

// Configure Multer for memory storage (buffers can be uploaded directly to Cloudinary or fallback)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Helper function to upload buffer to Cloudinary with safe fallback
const uploadToCloudinary = (fileBuffer, originalName = "hero-image") => {
  return new Promise((resolve, reject) => {
    // If Cloudinary credentials are configured
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET &&
      process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name"
    ) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "jbc_hero_images",
          public_id: `hero_${Date.now()}_${originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, "_")}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            // Fallback to base64 Data URI if Cloudinary returns error
            const base64 = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
            resolve({ secure_url: base64, public_id: "local_base64" });
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(fileBuffer);
    } else {
      // Fallback: create base64 Data URI so uploading still works without external API keys setup
      console.log("Cloudinary keys not set or placeholder. Using Data URI fallback.");
      const base64 = `data:image/jpeg;base64,${fileBuffer.toString("base64")}`;
      resolve({ secure_url: base64, public_id: "local_base64" });
    }
  });
};

module.exports = { cloudinary, upload, uploadToCloudinary };
