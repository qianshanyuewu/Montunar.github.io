const requests = new Map<string, Promise<unknown>>();
export const invalidateJson = (url: string) => requests.delete(url);
export async function fetchJson<T>(url: string): Promise<T> {
  if (requests.has(url)) return requests.get(url) as Promise<T>;
  const request = (async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}`);
          if (response.status >= 400 && response.status < 500)
            throw Object.assign(error, { permanent: true });
          throw error;
        }
        return (await response.json()) as T;
      } catch (error) {
        if ((error as { permanent?: boolean }).permanent || attempt === 2) throw error;
        await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      }
    }
    throw new Error('Request failed');
  })();
  requests.set(url, request);
  try {
    return await request;
  } catch (error) {
    requests.delete(url);
    throw error;
  }
}
