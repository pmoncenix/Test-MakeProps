import { AppError } from "../errors/AppError.js";

export interface PhotoUpload {
  mimeType: string;
  data: Buffer;
}

const MAX_PHOTOS = 5;
const ACCEPTED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function validatePhotoUploads(photos: readonly PhotoUpload[]): void {
  if (photos.length < 1 || photos.length > MAX_PHOTOS) {
    throw invalidPhotosError();
  }

  if (photos.some((photo) => !isValidImage(photo))) {
    throw invalidPhotosError();
  }
}

export function isValidImage(photo: PhotoUpload): boolean {
  if (!ACCEPTED_MIME_TYPES.has(photo.mimeType)) return false;

  const { data, mimeType } = photo;
  if (mimeType === "image/jpeg") {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return data.length >= 8
      && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }

  return data.length >= 12
    && data.toString("ascii", 0, 4) === "RIFF"
    && data.toString("ascii", 8, 12) === "WEBP";
}

function invalidPhotosError(): AppError {
  return new AppError(
    400,
    "INVALID_PHOTOS",
    "Ajoutez entre 1 et 5 images JPEG, PNG ou WebP valides (5 Mo maximum par image).",
  );
}
