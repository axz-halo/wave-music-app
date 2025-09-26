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

export function parseYouTubePlaylistId(input: string): string | null {
  if (!input) return null;
  try {
    const trimmed = input.trim();
    
    // 1. Full playlist URL: https://www.youtube.com/playlist?list=PLxxxx
    const playlistUrlMatch = trimmed.match(/youtube\.com\/playlist\?list=([A-Za-z0-9_-]+)/);
    if (playlistUrlMatch) return playlistUrlMatch[1];
    
    // 2. Watch URL with playlist: https://youtube.com/watch?v=...&list=PLxxxx
    const watchUrlMatch = trimmed.match(/[?&]list=([A-Za-z0-9_-]+)/);
    if (watchUrlMatch) return watchUrlMatch[1];
    
    // 3. Short playlist URL: https://youtu.be/xxxx?list=PLxxxx
    const shortUrlMatch = trimmed.match(/youtu\.be\/[A-Za-z0-9_-]+\?list=([A-Za-z0-9_-]+)/);
    if (shortUrlMatch) return shortUrlMatch[1];
    
    // 4. Direct playlist ID: PLxxxx, UUxxxx, LLxxxx, OLxxxx, RDxxxx
    const directIdMatch = trimmed.match(/^(PL|UU|LL|OL|RD)[A-Za-z0-9_-]+$/);
    if (directIdMatch) return directIdMatch[0];
    
    // 5. Generic ID pattern (fallback)
    const genericIdMatch = trimmed.match(/^[A-Za-z0-9_-]{10,}$/);
    if (genericIdMatch) return genericIdMatch[0];
    
    return null;
  } catch {
    return null;
  }
}

export function parseYouTubeChannelId(input: string): string | null {
  if (!input) return null;
  try {
    const trimmed = input.trim();
    
    // 1. Channel URL: https://www.youtube.com/channel/UCxxxx
    const channelUrlMatch = trimmed.match(/youtube\.com\/channel\/([A-Za-z0-9_-]+)/);
    if (channelUrlMatch) return channelUrlMatch[1];
    
    // 2. Handle URL: https://www.youtube.com/@handle
    const handleUrlMatch = trimmed.match(/youtube\.com\/@([A-Za-z0-9_.-]+)/);
    if (handleUrlMatch) {
      // For handle URLs, we need to resolve to channel ID via API
      // For now, return the handle as-is and let the API resolve it
      return handleUrlMatch[1];
    }
    
    // 3. User URL: https://www.youtube.com/user/username
    const userUrlMatch = trimmed.match(/youtube\.com\/user\/([A-Za-z0-9_.-]+)/);
    if (userUrlMatch) return userUrlMatch[1];
    
    // 4. Direct Channel ID: UCxxxx (starts with UC)
    const directChannelMatch = trimmed.match(/^(UC[A-Za-z0-9_-]{20,})$/);
    if (directChannelMatch) return directChannelMatch[1];
    
    // 5. Handle without @: handle (just the handle name)
    const handleMatch = trimmed.match(/^[A-Za-z0-9_.-]+$/);
    if (handleMatch && !trimmed.includes('.')) {
      // Likely a handle if it doesn't contain dots and is reasonable length
      return trimmed;
    }
    
    return null;
  } catch {
    return null;
  }
}


