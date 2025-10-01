/**
 * Test Tracklist Extraction
 * Tests if the system can extract tracklists from YouTube videos
 */

const testVideoId = 'Ju9vpOPeZIg';
const API_KEY = process.env.YT_API_KEY || 'AIzaSyCs23HnOg6r7VmpD_hEPqOr4wkx80hYmEg';

async function testTracklistExtraction() {
  console.log('🧪 Testing Tracklist Extraction');
  console.log('Video ID:', testVideoId);
  console.log('URL: https://www.youtube.com/watch?v=' + testVideoId);
  console.log('---');

  try {
    // 1. Fetch video details
    console.log('📹 Fetching video details...');
    const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${testVideoId}&key=${API_KEY}`;
    const videoRes = await fetch(videoUrl);
    const videoData = await videoRes.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      console.log('❌ Video not found');
      return;
    }

    const video = videoData.items[0];
    console.log('✅ Video Title:', video.snippet.title);
    console.log('✅ Channel:', video.snippet.channelTitle);
    console.log('---');

    // 2. Parse description for tracklist
    console.log('📝 Parsing description for tracklist...');
    const description = video.snippet.description || '';
    const descriptionTracks = parseTracklist(description);
    
    if (descriptionTracks.length > 0) {
      console.log(`✅ Found ${descriptionTracks.length} tracks in description:`);
      descriptionTracks.slice(0, 5).forEach((track, i) => {
        console.log(`  ${i + 1}. ${track.timestamp || '--:--'} ${track.artist} - ${track.title}`);
      });
      if (descriptionTracks.length > 5) {
        console.log(`  ... and ${descriptionTracks.length - 5} more`);
      }
      return descriptionTracks;
    }

    // 3. Try comments if no tracks in description
    console.log('💬 Checking comments for tracklist...');
    const commentsUrl = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${testVideoId}&maxResults=20&order=relevance&key=${API_KEY}`;
    const commentsRes = await fetch(commentsUrl);
    const commentsData = await commentsRes.json();

    if (commentsData.items) {
      for (const comment of commentsData.items) {
        const commentText = comment.snippet.topLevelComment.snippet.textDisplay;
        const commentTracks = parseTracklist(commentText);
        
        if (commentTracks.length > 3) { // At least 3 tracks to be considered a tracklist
          console.log(`✅ Found ${commentTracks.length} tracks in comments:`);
          commentTracks.slice(0, 5).forEach((track, i) => {
            console.log(`  ${i + 1}. ${track.timestamp || '--:--'} ${track.artist} - ${track.title}`);
          });
          if (commentTracks.length > 5) {
            console.log(`  ... and ${commentTracks.length - 5} more`);
          }
          return commentTracks;
        }
      }
    }

    console.log('❌ No tracklist found in description or comments');
    console.log('ℹ️  This video will be saved as a single track');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

function parseTracklist(text) {
  const tracks = [];
  const lines = text.split('\n');
  
  const patterns = [
    // HH:MM:SS or MM:SS followed by Artist - Title
    /(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+?)\s*[-–—]\s*(.+)/,
    /(\d{1,2}:\d{2})\s+(.+?)\s*[-–—]\s*(.+)/,
    // Numbered: 1. Artist - Title
    /^\d+\.\s*(.+?)\s*[-–—]\s*(.+)$/,
    // Simple: Artist - Title
    /^(.+?)\s*[-–—]\s*(.+)$/,
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) continue;
    
    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        let timestamp = '';
        let artist = '';
        let title = '';
        
        if (match.length === 4 && match[1].includes(':')) {
          // Has timestamp
          timestamp = match[1];
          artist = match[2].trim();
          title = match[3].trim();
        } else if (match.length === 3) {
          // No timestamp
          artist = match[1].trim();
          title = match[2].trim();
        }
        
        if (artist && title && artist.length > 1 && title.length > 1) {
          tracks.push({ timestamp, artist, title });
          break;
        }
      }
    }
  }
  
  return tracks;
}

// Run the test
testTracklistExtraction().then(() => {
  console.log('\n✅ Test complete');
});

