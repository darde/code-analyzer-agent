import { readFileSync } from "fs";
import { detectLanguage } from "../utils/language.js";

export interface CodeFileResult {
  content: string;
  language: string;
  filePath: string;
}

export function readCodeFile(filePath: string): CodeFileResult {
  const content = readFileSync(filePath, "utf-8");
  const language = detectLanguage(filePath);
  return { content, language, filePath };
}
