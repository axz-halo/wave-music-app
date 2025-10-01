# Station Feature Enhancement & Production Solutions

## 📊 Current Architecture Analysis

### The Problem
Your station feature has a **hybrid architecture** that doesn't work in production:

1. **Python Crawler** (`youtube_playlist_scraper.py`)
   - ✅ Uses Selenium for web scraping
   - ✅ Extracts music tracklists from video descriptions/comments
   - ❌ **Only works in local development environment**
   - ❌ Requires browser automation (Selenium/ChromeDriver)
   - ❌ Can't run in serverless Next.js deployment

2. **Batch Processing** (`batch_processor.py`)
   - ✅ Processes playlists in queue
   - ❌ **Requires Python server running locally**
   - ❌ Not scalable for production

3. **Current Workflow**
   ```
   User Upload → Queue in Supabase → Wait for Python batch processor
   ❌ If Python not running → Playlists stuck in "pending" forever
   ```

## 🚀 **RECOMMENDED SOLUTIONS**

### **Option 1: Serverless + Third-Party API (Best for Production)**

Replace Python crawler with a **100% serverless** solution using third-party APIs.

#### Implementation

##### A. Use YouTube Data API v3 + Enhanced Parsing
```typescript
// Enhanced YouTube API implementation
export async function extractPlaylistTracks(playlistId: string) {
  const API_KEY = process.env.YT_API_KEY;
  
  // 1. Get all playlist items
  const items = await fetchAllPlaylistItems(playlistId);
  
  // 2. Extract video descriptions in batch
  const videoDetails = await batchFetchVideoDetails(items.map(i => i.videoId));
  
  // 3. Parse tracklists from descriptions using regex patterns
  const tracks = videoDetails.flatMap(video => 
    parseTracklistFromDescription(video.description)
  );
  
  return tracks;
}
```

##### B. Add Spotify/MusicBrainz API Integration
```typescript
// For better music metadata
async function enrichTrackMetadata(track: { artist: string; title: string }) {
  // Use Spotify API or MusicBrainz for accurate metadata
  const spotifyResult = await searchSpotifyTrack(track.artist, track.title);
  
  return {
    ...track,
    album: spotifyResult.album,
    albumArt: spotifyResult.images[0].url,
    duration: spotifyResult.duration_ms,
    spotifyUri: spotifyResult.uri
  };
}
```

**Pros:**
- ✅ 100% serverless, scales automatically
- ✅ No infrastructure to maintain
- ✅ Works in any deployment (Vercel, Netlify, etc.)
- ✅ Faster processing

**Cons:**
- ⚠️ May have API quota limits
- ⚠️ Requires API keys

---

### **Option 2: Serverless Container with Puppeteer (Medium Complexity)**

Deploy Python crawler as a **serverless container function**.

#### Implementation

##### A. Dockerize Python Crawler
```dockerfile
# Dockerfile
FROM python:3.9-slim

# Install Chrome for Selenium
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "batch_processor.py", "--once"]
```

##### B. Deploy to Cloud Run / AWS Lambda Containers
```bash
# Google Cloud Run
gcloud run deploy wave-crawler \
  --source . \
  --platform managed \
  --timeout 900 \
  --memory 2Gi

# Or AWS Lambda Container
aws lambda create-function \
  --function-name wave-crawler \
  --package-type Image \
  --timeout 900
```

##### C. Trigger from Next.js API
```typescript
// src/app/api/station/upload/route.ts
export async function POST(req: NextRequest) {
  // Instead of queueing, trigger cloud function directly
  const response = await fetch(process.env.CRAWLER_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({ playlistUrl }),
  });
  
  return response.json();
}
```

**Pros:**
- ✅ Keeps your existing Python code
- ✅ Scales automatically
- ✅ Works in production

**Cons:**
- ⚠️ Higher cost than pure serverless
- ⚠️ Cold start times
- ⚠️ More complex deployment

---

### **Option 3: Queue + Background Worker (Best for Scale)**

Use a proper **job queue system** instead of database polling.

#### Implementation

##### A. Use Vercel Background Functions (Serverless)
```typescript
// src/app/api/station/upload/route.ts
import { queue } from '@vercel/functions';

export async function POST(req: NextRequest) {
  const { playlistUrl } = await req.json();
  
  // Queue the job
  await queue.enqueue('process-playlist', { playlistUrl });
  
  return NextResponse.json({ 
    success: true,
    message: 'Processing started'
  });
}

// src/app/api/jobs/process-playlist/route.ts
export async function POST(req: NextRequest) {
  const { playlistUrl } = await req.json();
  
  // Process using YouTube API
  const tracks = await extractPlaylistTracks(playlistUrl);
  await saveToDatabase(tracks);
  
  return NextResponse.json({ success: true });
}
```

##### B. Or Use Redis/BullMQ
```typescript
// With Redis queue
import { Queue } from 'bullmq';

const playlistQueue = new Queue('playlists', {
  connection: {
    host: process.env.REDIS_HOST,
    port: 6379,
  }
});

// Enqueue job
await playlistQueue.add('process', { playlistUrl });
```

**Pros:**
- ✅ Proper job queue system
- ✅ Retry logic built-in
- ✅ Scalable workers
- ✅ Works with any processing method

**Cons:**
- ⚠️ Requires additional service (Redis/queue)
- ⚠️ More complex architecture

---

### **Option 4: Hybrid Approach (Recommended for Your Use Case)**

Combine YouTube API for basic processing + optional local Python for advanced features.

#### Implementation Strategy

```typescript
// Enhanced station upload with fallback
export async function POST(req: NextRequest) {
  const { playlistUrl, advanced = false } = await req.json();
  
  if (advanced && process.env.PYTHON_CRAWLER_ENABLED === 'true') {
    // Use Python crawler for advanced scraping
    return await queueForPythonProcessing(playlistUrl);
  } else {
    // Use immediate YouTube API processing
    const tracks = await quickProcessPlaylist(playlistUrl);
    await saveToDatabase(tracks);
    
    return NextResponse.json({ 
      success: true,
      tracks,
      message: 'Playlist processed immediately'
    });
  }
}
```

**Benefits:**
- ✅ Works in production without Python
- ✅ Optionally use Python for better results
- ✅ Immediate feedback to users
- ✅ Flexible deployment

---

## 💡 **IMMEDIATE FIXES** (Apply These Now)

### 1. Fix the Immediate Upload Experience

Replace batch queue with direct processing:

```typescript
// src/app/api/station/upload/route.ts
export async function POST(req: NextRequest) {
  const { url, type } = await req.json();
  
  try {
    if (type === 'playlist') {
      // Process immediately using YouTube API
      const playlistId = parseYouTubePlaylistId(url);
      const items = await fetchPlaylistItems(playlistId);
      
      // Save directly to station_playlists
      const playlist = await savePlaylistToDatabase({
        playlistId,
        items,
        userId,
      });
      
      return NextResponse.json({
        success: true,
        message: '플레이리스트가 추가되었습니다!',
        playlist,
        status: 'completed' // Not pending!
      });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      message: error.message 
    }, { status: 500 });
  }
}
```

### 2. Enhanced Tracklist Parsing

Improve regex patterns for better music extraction:

```typescript
function parseTracklistFromText(text: string): Track[] {
  const tracks: Track[] = [];
  const lines = text.split('\n');
  
  const patterns = [
    // Various timestamp formats
    /(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+?)\s*[-–—]\s*(.+)/,
    /(\d{1,2}:\d{2})\s+(.+?)\s+[-–—]\s+(.+)/,
    // Numbered lists
    /^\d+\.\s*(.+?)\s*[-–—]\s*(.+)$/,
    // Simple separator
    /^(.+?)\s*[-–—]\s*(.+)$/,
  ];
  
  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        tracks.push(extractTrackFromMatch(match));
        break;
      }
    }
  }
  
  return tracks;
}
```

### 3. Add Progress Indicators

Show real-time progress instead of "1-2 hours wait":

```typescript
// Use Server-Sent Events (SSE)
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('data: {"status":"starting"}\n\n'));
      
      // Process playlist
      const items = await fetchPlaylistItems(playlistId);
      controller.enqueue(encoder.encode(`data: {"status":"processing","progress":50}\n\n`));
      
      const tracks = await extractTracks(items);
      controller.enqueue(encoder.encode(`data: {"status":"complete","tracks":${tracks.length}}\n\n`));
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

## 📈 **RECOMMENDED IMPLEMENTATION PLAN**

### Phase 1: Quick Fix (1-2 days)
1. ✅ Replace batch queue with direct YouTube API processing
2. ✅ Add better tracklist parsing
3. ✅ Improve error handling and user feedback
4. ✅ Remove dependency on Python for basic features

### Phase 2: Enhanced Features (1 week)
1. ✅ Add music metadata enrichment (Spotify API)
2. ✅ Implement progress indicators
3. ✅ Add retry logic for failed uploads
4. ✅ Create admin dashboard for monitoring

### Phase 3: Advanced Features (Optional)
1. ⚡ Deploy Python crawler as serverless container (if needed)
2. ⚡ Add AI-powered track parsing (GPT-4)
3. ⚡ Implement caching layer (Redis)
4. ⚡ Add analytics and usage tracking

---

## 🔧 **CODE EXAMPLES**

### Enhanced Production-Ready Upload Route

```typescript
// src/app/api/station/upload-enhanced/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { parseYouTubePlaylistId } from '@/lib/youtube';

const YT_API_KEY = process.env.YT_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    const playlistId = parseYouTubePlaylistId(url);
    
    if (!playlistId) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid playlist URL' 
      }, { status: 400 });
    }

    // 1. Fetch playlist metadata
    const playlistMeta = await fetchPlaylistMetadata(playlistId);
    
    // 2. Fetch all playlist items (handle pagination)
    const items = await fetchAllPlaylistItems(playlistId);
    
    // 3. Fetch video details in batches (YouTube API limit: 50 per request)
    const tracks = await batchProcessVideos(items);
    
    // 4. Save to database
    const { data, error } = await supabaseServer
      .from('station_playlists')
      .insert({
        playlist_id: playlistId,
        title: playlistMeta.title,
        description: playlistMeta.description,
        thumbnail_url: playlistMeta.thumbnail,
        channel_title: playlistMeta.channelTitle,
        channel_info: playlistMeta.channelInfo,
        tracks: tracks,
        user_id: req.headers.get('user-id'),
        status: 'completed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Successfully added ${tracks.length} tracks`,
      playlist: data
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    
    return NextResponse.json({
      success: false,
      message: error.message || 'Failed to process playlist'
    }, { status: 500 });
  }
}

async function fetchAllPlaylistItems(playlistId: string) {
  let items: any[] = [];
  let nextPageToken = '';
  
  do {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', playlistId);
    url.searchParams.set('maxResults', '50');
    url.searchParams.set('key', YT_API_KEY!);
    if (nextPageToken) url.searchParams.set('pageToken', nextPageToken);
    
    const res = await fetch(url.toString());
    const data = await res.json();
    
    items.push(...(data.items || []));
    nextPageToken = data.nextPageToken || '';
  } while (nextPageToken);
  
  return items;
}

async function batchProcessVideos(items: any[]) {
  const tracks = [];
  
  // Process in batches of 50 (YouTube API limit)
  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const videoIds = batch.map(item => item.contentDetails.videoId).join(',');
    
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', videoIds);
    url.searchParams.set('key', YT_API_KEY!);
    
    const res = await fetch(url.toString());
    const data = await res.json();
    
    for (const video of data.items || []) {
      tracks.push({
        id: video.id,
        title: video.snippet.title,
        artist: video.snippet.channelTitle,
        thumbnail_url: video.snippet.thumbnails.medium.url,
        duration: parseDuration(video.contentDetails.duration),
        youtube_url: `https://www.youtube.com/watch?v=${video.id}`,
        platform: 'youtube'
      });
    }
  }
  
  return tracks;
}

function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  
  return hours * 3600 + minutes * 60 + seconds;
}
```

---

## 🎯 **IMMEDIATE ACTION ITEMS**

1. **Stop using batch queue for now** - It only works with Python running
2. **Use the enhanced upload route above** - Pure serverless, works everywhere
3. **Add user feedback** - Show real-time progress
4. **Test with various playlists** - Ensure it handles edge cases
5. **Monitor API quotas** - YouTube API has daily limits

---

## 📊 **API Quota Management**

YouTube Data API v3 quotas:
- **10,000 units per day** (free tier)
- Playlist items request: 1 unit
- Video details request: 1 unit
- For 100-track playlist: ~3-4 units

**Solution:** Implement caching
```typescript
// Cache playlist data for 24 hours
const cachedData = await redis.get(`playlist:${playlistId}`);
if (cachedData) return JSON.parse(cachedData);

// Fetch and cache
const data = await fetchPlaylistData(playlistId);
await redis.setex(`playlist:${playlistId}`, 86400, JSON.stringify(data));
```

---

## 🚀 **Next Steps**

Choose one of the options above based on your needs:

- **Quick & Simple**: Option 1 (YouTube API only) ← **Start Here**
- **Advanced Features**: Option 4 (Hybrid)
- **Keep Python**: Option 2 (Containerize)
- **Best Scale**: Option 3 (Queue system)

Would you like me to implement any of these solutions for you?

