import { BrowserContext, Page } from 'playwright';
import { Course } from './courses';
import { fetchCourseToc, flattenToc, TocItem } from './toc';
import { config } from './config';
import { sleepWithJitter } from './timer';
import { detectAssessment, handleManualAssessment } from './assessmentDetector';
import { waitForUserSignal } from './cli';
import { requestWithRetry } from './requestHelper';
import { getLastPageId, saveProgress } from './persistence';

export async function runCourse(course: Course, context: BrowserContext): Promise<{ halted: boolean }> {
  const rawToc = await fetchCourseToc(course.id, context.request);
  const pagesToVisit = flattenToc(rawToc);

  // 1. Check for existing progress
  let pagesToProcess = pagesToVisit;
  const lastCompletedId = getLastPageId(course.id);

  if (lastCompletedId) {
    const lastCompletedIndex = pagesToVisit.findIndex(page => page.path === lastCompletedId);
    if (lastCompletedIndex !== -1 && lastCompletedIndex < pagesToVisit.length - 1) {
      console.log(`[RESUME] Found previous progress. Skipping to after: ${lastCompletedId}`);
      pagesToProcess = pagesToVisit.slice(lastCompletedIndex + 1);
    } else if (lastCompletedIndex === pagesToVisit.length - 1) {
      console.log(`[INFO] All pages already completed for course: ${course.name}.`);
      return { halted: false };
    }
  }

  console.log(`[INFO] Course "${course.name}" loaded. Found ${pagesToVisit.length} pages, ${pagesToProcess.length} remaining.`);

  const page = await context.newPage();

  for (const [index, tocPage] of pagesToProcess.entries()) {
    console.log(`[PROGRESS] [${index + 1}/${pagesToProcess.length}] Processing: ${tocPage.title}`);

    const pathForApi = tocPage.path;
    const { isAssessment, data } = await detectAssessment(course.id, pathForApi, context.request);

    if (isAssessment) {
        await handleManualAssessment(data);
        console.log('[HALT] Automation paused for manual assessment. Exiting course runner.');
        await waitForUserSignal('[INFO] Please complete the manual assessment and then press Enter to continue...');
        saveProgress(course.id, tocPage.path);
        continue;
    }

    const pageUrl = `${config.baseUrl}${tocPage.url}`;
    await navigateToPage(page, pageUrl, tocPage);
    await sendPing(course.id, pathForApi, context.request);
    saveProgress(course.id, tocPage.path);
    await sleepWithJitter(config.pageWaitTime);
  }

  console.log(`[SUCCESS] Completed navigation for: ${course.name}`);
  await page.close();
  return { halted: false };
}

async function navigateToPage(page: Page, url: string, tocItem: TocItem) {
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  } catch (err) {
    console.error(`[ERROR] Failed to navigate to ${tocItem.title}:`, err);
  }
}

async function sendPing(courseId: number, path: string, request: any) {
    const pingUrl = `${config.baseUrl}/lms/course/ping/${courseId}/${path}`;
    try {
        const response = await request.put(pingUrl, { data: { ping: true } });
        if (response.ok()) {
            console.log(`[PING] Heartbeat sent for page ${path}`);
        }
        if(!response.ok()) {
            console.warn(`[PING WARN] Heartbeat failed for page ${path}. Retrying...`);
             await requestWithRetry(() => request.put(pingUrl, { data: { ping: true } }));
        }
    } catch (e) {
        console.error(`[PING ERROR] Failed to send heartbeat: ${e}`);
    }
}