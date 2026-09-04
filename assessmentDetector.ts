import { APIRequestContext } from 'playwright';
import { config } from './config';
import { requestWithRetry } from './requestHelper';
import { draftAnswer } from './answerAssistant';

export interface PageMetadata {
  required_score: number;
  id: string;
  title: string;
  type: string;
  rubric: any[];
  placeholders?: any;
}

export async function detectAssessment(courseId: number, pagePath: string, request: APIRequestContext): Promise<{ isAssessment: boolean; data: PageMetadata }> {
  // The path in the TOC might be "1/2", which matches the API structure
  const url = `${config.baseUrl}/api/models/course/${courseId}/page/${pagePath}`;
  
   const response = await requestWithRetry(() => request.get(url));
  if (!response.ok()) {
    throw new Error(`Failed to fetch page metadata for ${pagePath}`);
  }

  const data: PageMetadata = await response.json();

  // If rubric has items, it's an assessment or interactive activity
  const isAssessment = data.rubric && data.rubric.length > 0;

  return {
    isAssessment,
    data
  };
}

/**
 * PLACEHOLDER for manual/future assessment handling.
 * Per the ethical brief, this is where automation stops so a human can act.
 */
export async function handleManualAssessment(pageData: PageMetadata) {
    console.log(`\n===================================================`);
    console.log(`       📚 STUDY ASSISTANT: ASSESSMENT DETECTED      `);
    console.log(`===================================================`);
    console.log(`COURSE: ${pageData.placeholders?.course_full_title || 'N/A'}`);
    console.log(`TASK:   ${pageData.title}`);
    console.log(`---------------------------------------------------`);

    // 1. Check for specific requirements/scoring
    if (pageData.required_score > 0) {
        console.log(`[!] REQUIRED SCORE: ${pageData.required_score}% to pass.`);
    }

    // 2. Parse the Rubric to explain "What is expected"
    console.log(`\nINSTRUCTIONS FOR THIS TASK:`);

    for (const [index, item] of pageData.rubric.entries()) {
        // Clean up the 'name' or 'id' which often contains the full question text
        const questionPrompt = item.name || item.id;
        const formattedPrompt = formatPrompt(questionPrompt);

        console.log(`\n[Item #${index + 1}]`);
        console.log(`Type of response required: ${item.type.toUpperCase()}`);
        console.log(`Prompt: "${formattedPrompt}"`);

        if (item.response) {
            console.log(`Status: You have a saved draft (${item.response.length} characters).`);
        } else {
            console.log(`Status: Not yet started.`);
        }

        // Only draft for open-ended items — 'true_false'/quiz items in this
        // LMS only expose an opaque id like "q1", not real question text, so
        // there's nothing to meaningfully draft an answer from.
        if (item.type === 'response' && !item.response) {
            const suggestion = await draftAnswer(formattedPrompt, pageData.placeholders?.course_full_title);
            if (suggestion) {
                console.log(`\n[SUGGESTED DRAFT — review/edit before using]:`);
                console.log(suggestion);
            }
        }
    }

    console.log(`\n---------------------------------------------------`);
    console.log(`[ACTION] Automation is now paused.`);
    console.log(`The browser is open for you to complete the work above.`);
    console.log(`===================================================\n`);
}

/**
 * Helper to make long, unspaced prompts readable
 * (Some LMSs strip spaces from IDs, this attempts to make them readable)
 */
function formatPrompt(text: string): string {
    // If the text is very long and has no spaces, it's likely a technical ID
    // Otherwise, just return it.
    if (text.length > 50 && !text.includes(' ')) {
        return text.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capital letters
    }
    return text;
}