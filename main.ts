import { loginToPns } from "./login";
import { logger } from "./logger";
import { fetchEnrolledCourses, searchEnrolledCourses, Course } from './courses';
import { config } from './config';
import { runCourse } from './courseRunner';

async function main() {
  const session = await loginToPns();

  logger.info("Session is authenticated and ready for the next step.");

  const selectedCourses: Course[] = [];

  for (const name of config.targetCourseNames) {
    const matches = await searchEnrolledCourses(session.context.request, name);
    const exact = matches.find(c => c.name === name);
    if (exact) {
      selectedCourses.push(exact);
    } else {
      console.warn(`[WARN] No exact match for "${name}" — search returned ${matches.length} result(s).`);
    }
  }

  if (selectedCourses.length === 0) {
    console.warn('[WARN] No matching courses found from your .env configuration.');
    console.log('[INFO] Available courses on your account:');
    const allCourses = await fetchEnrolledCourses(session.context.request);
    allCourses.forEach(c => console.log(` - ${c.name} (ID: ${c.id})`));
    await session.browser.close();
    return;
  }

  console.log(`[INFO] Ready to process ${selectedCourses.length} course(s):`);
  let halted = false;
  for (const course of selectedCourses) {
    console.log(` -> Starting Course: ${course.name} [ID: ${course.id}]`);
    const result = await runCourse(course, session.context);
    /*if (result.halted) {
      halted = true;
      break;
    }*/
  }

  if (halted) {
    console.log('[INFO] Leaving the browser open so you can complete the assessment. Close the window when you\'re done.');
    return;
  }

  if (!config.headless) {
    await session.page.waitForTimeout(5000);
  }

  await session.browser.close();
}

main().catch((err) => {
  logger.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});