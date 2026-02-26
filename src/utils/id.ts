import { nanoid } from "nanoid";

export function generateId(size: number = 8): string {
  return nanoid(size);
}
