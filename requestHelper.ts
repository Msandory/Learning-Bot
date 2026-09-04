import { APIRequestContext, APIResponse } from 'playwright';

export async function requestWithRetry(
    fn: () => Promise<APIResponse>, 
    retries = 3, 
    delay = 2000
): Promise<APIResponse> {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fn();
            // If the server returns a 5xx error, we might want to retry that too
            if (response.status() >= 500) throw new Error(`Server Error: ${response.status()}`);
            return response;
        } catch (err) {
            if (i === retries - 1) throw err; // Out of retries
            console.warn(`[RETRY] Request failed (${(err as any).message}). Retrying in ${delay}ms... (${i + 1}/${retries})`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
    throw new Error('Request failed after maximum retries');
}