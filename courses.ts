import { APIRequestContext } from 'playwright';
import { config } from './config';

export interface Course {
  id: number;
  name: string;
  // There are likely more fields like 'status' or 'progress', 
  // but these are what we need for identification.
}

export async function fetchEnrolledCourses(request: APIRequestContext): Promise<Course[]> {
  console.log('[INFO] Fetching enrolled courses from API...');

  const perPage = 50;
  let page = 1;
  const courses: Course[] = [];

  while (true) {
    const response = await request.get(`${config.baseUrl}/api/lists/authed/courses/enrolled`, {
      params: {
        page,
        per_page: perPage,
        sort_by: 'name',
        order: 'desc'
      }
    });

    if (!response.ok()) {
      throw new Error(`Failed to fetch courses: ${response.status()} ${response.statusText()}`);
    }

    const data = await response.json();
    const batch: Course[] = data.data || data;

    courses.push(...batch);

    if (batch.length < perPage) break;
    page++;
  }

  console.log(`[INFO] Successfully retrieved ${courses.length} courses.`);
  return courses;
}

export async function searchEnrolledCourses(request: APIRequestContext, search: string): Promise<Course[]> {
  console.log(`[INFO] Searching enrolled courses for "${search}"...`);

  const response = await request.get(`${config.baseUrl}/api/lists/authed/courses/enrolled`, {
    params: {
      page: 1,
      per_page: 50,
      sort_by: 'name',
      order: 'desc',
      search
    }
  });

  if (!response.ok()) {
    throw new Error(`Failed to search courses: ${response.status()} ${response.statusText()}`);
  }

  const data = await response.json();
  const courses: Course[] = data.data || data;

  console.log(`[INFO] Found ${courses.length} course(s) matching "${search}".`);
  return courses;
}