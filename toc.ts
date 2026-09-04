import { APIRequestContext } from 'playwright';
import { config } from './config';

export interface TocItem {
  path: string;
  title: string;
  type: 'page' | 'folder';
  url: string;
  nav?: TocItem[]; // present when type === 'folder' — nested pages
}

export async function fetchCourseToc(courseId: number, request: APIRequestContext): Promise<TocItem[]> {
  console.log(`[INFO] Fetching TOC for course ${courseId}...`);
  
  const response = await request.get(`${config.baseUrl}/lms/course/toc/${courseId}`);
  
  if (!response.ok()) {
    throw new Error(`Failed to fetch TOC: ${response.status()}`);
  }

  return await response.json();
}

/**
 * Recursively converts the nested TOC structure into a flat list of pages.
 */
export function flattenToc(items: TocItem[]): TocItem[] {
  let flatList: TocItem[] = [];

  for (const item of items) {
    if (item.type === 'page') {
      flatList.push(item);
    } else if (item.type === 'folder' && item.nav) {
      flatList = flatList.concat(flattenToc(item.nav));
    }
  }

  return flatList;
}