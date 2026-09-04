import * as dotenv from "dotenv";
import * as path from "path";

// Load .env from the project root regardless of which file/cwd triggers this.
dotenv.config({ path: path.resolve(__dirname, ".env") });

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

export const config = {
  baseUrl: process.env.PNS_BASE_URL ?? "https://pack-n-stack.znanja.com",
  email: required("PNS_EMAIL"),
  password: required("PNS_PASSWORD"),
  headless: (process.env.HEADLESS ?? "false").toLowerCase() === "true",
  // Split by comma and trim whitespace: "Course A, Course B" -> ["Course A", "Course B"]
   targetCourseNames: (process.env.COURSES || '').split(',').map(name => name.trim()).filter(name => name.length > 0),
  // Optional — only needed for the draft-answer assist feature. Left optional
  // (not `required(...)`) so the bot still runs fine without it, just
  // skipping AI-drafted answers at assessment halts.
  geminiApiKey: process.env.GEMINI_API_KEY,
  // Base delay (ms) between page navigations, jittered by sleepWithJitter.
  pageWaitTime: Number(process.env.PAGE_WAIT_TIME_MS ?? 3000),
};

export const loginUrl = `${config.baseUrl}/login`;