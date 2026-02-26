import { readFileSync } from "fs";
import pdfParse from "pdf-parse";

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
}

export async function extractPdfText(
  filePath: string
): Promise<PdfExtractionResult> {
  const buffer = readFileSync(filePath);
  const data = await pdfParse(buffer);
  return {
    text: data.text,
    pageCount: data.numpages,
  };
}
