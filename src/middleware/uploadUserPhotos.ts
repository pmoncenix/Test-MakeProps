import multer from "multer";
import type { RequestHandler } from "express";
import { AppError } from "../errors/AppError.js";

const supportedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const uploader = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 5,
    fields: 4,
    parts: 9,
  },
  fileFilter: (_request, file, callback) => {
    if (!supportedImageTypes.has(file.mimetype)) {
      callback(new AppError(400, "INVALID_PHOTOS", "Seules les images JPEG, PNG et WebP sont acceptées."));
      return;
    }

    callback(null, true);
  },
});

export const uploadUserPhotos: RequestHandler = (request, response, next) => {
  uploader.array("photos", 5)(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === "LIMIT_FILE_SIZE";
      next(new AppError(
        tooLarge ? 413 : 400,
        tooLarge ? "PHOTO_TOO_LARGE" : "INVALID_PHOTOS",
        tooLarge
          ? "Chaque image doit peser 5 Mo maximum."
          : "Le formulaire accepte jusqu’à 5 images dans le champ photos.",
      ));
      return;
    }

    next(error);
  });
};
