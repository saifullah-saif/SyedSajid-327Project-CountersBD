const { supabase } = require("./supabaseClient");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const { nanoid } = require("nanoid");

class FileUploadService {
  constructor() {
    this.storage = multer.memoryStorage();
    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: this.fileFilter.bind(this),
    });
  }

  fileFilter(req, file, cb) {
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    const allowedPdfTypes = ["application/pdf"];

    if (
      file.fieldname === "bannerImage" ||
      file.fieldname === "ticketBanner" ||
      file.fieldname === "logo"
    ) {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            "Only JPEG, JPG, PNG, and WebP images are allowed for banners and logos"
          ),
          false
        );
      }
    } else if (file.fieldname === "pdfTemplate") {
      if (allowedPdfTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("Only PDF files are allowed for templates"), false);
      }
    } else {
      cb(new Error("Invalid field name"), false);
    }
  }

  generateFileName(originalName, prefix = "") {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const uniqueId = nanoid(8);
    return `${prefix}${timestamp}_${uniqueId}${ext}`;
  }

  // Optimize image using Sharp
  async optimizeImage(buffer, options = {}) {
    const {
      width = 1200,
      height = 800,
      quality = 85,
      format = "jpeg",
    } = options;

    return await sharp(buffer)
      .resize(width, height, {
        fit: "cover",
        withoutEnlargement: true,
      })
      .toFormat(format, { quality })
      .toBuffer();
  }

  async uploadEventBanner(fileBuffer, originalName, eventId) {
    try {
      // Optimize the image
      const optimizedBuffer = await this.optimizeImage(fileBuffer, {
        width: 1200,
        height: 600,
        quality: 90,
      });

      const fileName = this.generateFileName(
        originalName,
        `event_${eventId}_banner_`
      );
      const filePath = `event-banners-img/${fileName}`;

      const { data, error } = await supabase.storage
        .from("assets")
        .upload(filePath, optimizedBuffer, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(`Failed to upload event banner: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(filePath);

      return {
        success: true,
        filePath: filePath,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
      };
    } catch (error) {
      console.error("Error uploading event banner:", error);
      throw error;
    }
  }

  async uploadTicketTypeBanner(
    fileBuffer,
    originalName,
    eventId,
    ticketTypeId
  ) {
    try {
      const optimizedBuffer = await this.optimizeImage(fileBuffer, {
        width: 800,
        height: 400,
        quality: 85,
      });

      const fileName = this.generateFileName(
        originalName,
        `event_${eventId}_ticket_${ticketTypeId}_banner_`
      );
      const filePath = `ticket-type-banners-img/${fileName}`;

      const { data, error } = await supabase.storage
        .from("assets")
        .upload(filePath, optimizedBuffer, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(
          `Failed to upload ticket type banner: ${error.message}`
        );
      }

      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(filePath);

      return {
        success: true,
        filePath: filePath,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
      };
    } catch (error) {
      console.error("Error uploading ticket type banner:", error);
      throw error;
    }
  }

  async uploadProfileImage(fileBuffer, originalName, userId) {
    try {
      // Optimize the image for profile
      const optimizedBuffer = await this.optimizeImage(fileBuffer, {
        width: 400,
        height: 400,
        quality: 90,
      });

      const fileName = this.generateFileName(
        originalName,
        `user_${userId}_profile_`
      );
      const filePath = `user-profile-img/${fileName}`;

      const { data, error } = await supabase.storage
        .from("assets")
        .upload(filePath, optimizedBuffer, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(`Failed to upload profile image: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(filePath);

      return {
        success: true,
        filePath: filePath,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
      };
    } catch (error) {
      console.error("Error uploading profile image:", error);
      throw error;
    }
  }

  async uploadTicketTypePdf(fileBuffer, originalName, eventId, ticketTypeId) {
    try {
      const fileName = this.generateFileName(
        originalName,
        `event_${eventId}_tickettype_${ticketTypeId}_template_`
      );
      const filePath = `ticket-type-pdf-templates/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("assets")
        .upload(filePath, fileBuffer, {
          contentType: "application/pdf",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw new Error(`Failed to upload PDF template: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("assets")
        .getPublicUrl(filePath);

      return {
        success: true,
        filePath: filePath,
        publicUrl: urlData.publicUrl,
        fileName: fileName,
      };
    } catch (error) {
      console.error("Error uploading PDF template:", error);
      throw error;
    }
  }

  async deleteFile(filePath) {
    try {
      const { error } = await supabase.storage
        .from("assets")
        .remove([filePath]);

      if (error) {
        console.error("Error deleting file:", error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  }

  // multer middleware for single file upload
  getSingleUploadMiddleware(fieldName) {
    return this.upload.single(fieldName);
  }

  // multer middleware for multiple file uploads
  getMultipleUploadMiddleware(fields) {
    return this.upload.fields(fields);
  }
}

module.exports = FileUploadService;
