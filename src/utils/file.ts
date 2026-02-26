import { existsSync, readFileSync, statSync } from "fs";
import { resolve } from "path";

export function resolveFilePath(filePath: string): string {
  return resolve(process.cwd(), filePath);
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

export function isDirectory(filePath: string): boolean {
  try {
    return statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

export function readTextFile(filePath: string): string {
  return readFileSync(filePath, "utf-8");
}
