import { extname } from "path";
import type { ChatCompletionContentPart } from "openai/resources/chat/completions";
import { isImageFile, imageFileToMessagePart } from "./image.js";
import { extractPdfText } from "./pdf.js";
import { readCodeFile } from "./code-file.js";

export async function fileToContentParts(
  filePath: string,
  textPrompt?: string
): Promise<ChatCompletionContentPart[]> {
  const ext = extname(filePath).toLowerCase();
  const parts: ChatCompletionContentPart[] = [];

  if (textPrompt) {
    parts.push({ type: "text", text: textPrompt });
  }

  if (isImageFile(filePath)) {
    // Images go as base64 image_url parts (requires a vision-capable model)
    parts.push(imageFileToMessagePart(filePath));
  } else if (ext === ".pdf") {
    // PDFs are converted to extracted text
    const { text, pageCount } = await extractPdfText(filePath);
    parts.push({
      type: "text",
      text: `[PDF — ${pageCount} page${pageCount !== 1 ? "s" : ""}]\n\n${text}`,
    });
  } else {
    // Treat everything else as a code or text file
    const { content, language } = readCodeFile(filePath);
    parts.push({
      type: "text",
      text: `\`\`\`${language}\n${content}\n\`\`\``,
    });
  }

  return parts;
}

export function requiresVisionModel(filePath: string): boolean {
  return isImageFile(filePath);
}
