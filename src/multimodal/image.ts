import { readFileSync } from "fs";
import { extname } from "path";
import type { ChatCompletionContentPartImage } from "openai/resources/chat/completions";

const MIME_MAP: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export const IMAGE_EXTENSIONS = new Set(Object.keys(MIME_MAP));

export function isImageFile(filePath: string): boolean {
  return IMAGE_EXTENSIONS.has(extname(filePath).toLowerCase());
}

export function imageFileToMessagePart(
  filePath: string
): ChatCompletionContentPartImage {
  const ext = extname(filePath).toLowerCase();
  const mimeType = MIME_MAP[ext];
  if (!mimeType) {
    throw new Error(
      `Unsupported image format: ${ext}. Supported formats: ${Object.keys(MIME_MAP).join(", ")}`
    );
  }

  const buffer = readFileSync(filePath);
  const base64 = buffer.toString("base64");

  return {
    type: "image_url",
    image_url: {
      url: `data:${mimeType};base64,${base64}`,
      detail: "high",
    },
  };
}
