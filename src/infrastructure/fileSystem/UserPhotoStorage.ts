import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PhotoUpload } from "../../users/photoUpload.js";

const PHOTO_URL_PREFIX = "/uploads/users/";

export class UserPhotoStorage {
  constructor(readonly directory: string) {}

  async store(photos: readonly PhotoUpload[]): Promise<string[]> {
    await mkdir(this.directory, { recursive: true });
    const storedUrls: string[] = [];

    try {
      for (const photo of photos) {
        const fileName = `${randomUUID()}${extensionForMimeType(photo.mimeType)}`;
        await writeFile(join(this.directory, fileName), photo.data, { flag: "wx" });
        storedUrls.push(`${PHOTO_URL_PREFIX}${fileName}`);
      }

      return storedUrls;
    } catch (error) {
      await this.remove(storedUrls).catch(() => undefined);
      throw error;
    }
  }

  async remove(photoUrls: readonly string[]): Promise<void> {
    await Promise.all(photoUrls.map(async (photoUrl) => {
      const fileName = photoUrl.startsWith(PHOTO_URL_PREFIX)
        ? photoUrl.slice(PHOTO_URL_PREFIX.length)
        : "";

      if (!/^[\da-f-]+\.(?:jpg|png|webp)$/i.test(fileName)) return;

      try {
        await unlink(join(this.directory, fileName));
      } catch (error) {
        if (!isMissingFileError(error)) throw error;
      }
    }));
  }
}

function extensionForMimeType(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg": return ".jpg";
    case "image/png": return ".png";
    case "image/webp": return ".webp";
    default: throw new Error("Type d’image non pris en charge.");
  }
}

function isMissingFileError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
