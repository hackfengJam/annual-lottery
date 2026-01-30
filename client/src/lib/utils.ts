import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const parseCSV = (content: string): any[] => {
  const lines = content.split(/\r\n|\n/);
  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(',');
    const obj: any = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index]?.trim();
    });
    
    result.push(obj);
  }
  
  return result;
};
