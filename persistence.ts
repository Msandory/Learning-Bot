import fs from 'fs';
import path from 'path';

const PROGRESS_FILE = path.join(process.cwd(), 'course_progress.json');

interface ProgressData {
  [courseId: string]: string; // Maps courseId to the last successfully completed page 'id' (e.g., "1/2")
}

export function saveProgress(courseId: number, lastPageId: string) {
  let data: ProgressData = {};
  
  if (fs.existsSync(PROGRESS_FILE)) {
    data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  }

  data[courseId.toString()] = lastPageId;
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2));
}

export function getLastPageId(courseId: number): string | null {
  if (!fs.existsSync(PROGRESS_FILE)) return null;
  
  const data: ProgressData = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
  return data[courseId.toString()] || null;
}