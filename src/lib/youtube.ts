export function parseYouTubeId(input: string): string | null {
  if (!input) return null;
  try {
    // Accept: full URL or just ID
    const idRegex = /^(?:https?:\/\/(?:www\.)?(?:m\.)?youtube\.com\/watch\?v=|https?:\/\/(?:www\.)?youtu\.be\/|^)([A-Za-z0-9_-]{11})/;
    const m = input.trim().match(idRegex);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}


