/**
 * Minimal leveled logger.
 *
 * We're not pulling in a logging library for a project this size — a thin
 * wrapper around console.log gives us consistent [INFO]/[WARN]/[ERROR]
 * prefixes (matching the log format in the project brief) without adding
 * a dependency we'd have to learn the API of.
 */

type Level = "INFO" | "WARN" | "ERROR";

function timestamp(): string {
  return new Date().toISOString();
}

function log(level: Level, message: string): void {
  const line = `[${level}] ${message}`;
  if (level === "ERROR") {
    console.error(line);
  } else if (level === "WARN") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (message: string) => log("INFO", message),
  warn: (message: string) => log("WARN", message),
  error: (message: string) => log("ERROR", message),
  /** Only used sparingly, for debugging during development. */
  debug: (message: string) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG ${timestamp()}] ${message}`);
    }
  },
};
