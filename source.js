// Container for video sources
let videoSources = [];

// URLs of M3U playlists
const m3uUrls = [
    'https://raw.githubusercontent.com/weareblahs/freeview/main/mytv_broadcasting.m3u8'
];

// Function to check if the channel is online
const isChannelOnline = async (url) => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error(`Error checking channel availability for ${url}:`, error);
        return false;
    }
};

// Function to fetch and process M3U channels
const fetchM3UChannels = async (m3uUrl) => {
    try {
        console.log(`Fetching M3U playlist from ${m3uUrl}`);
        const response = await fetch(m3uUrl);
        if (!response.ok) throw new Error('Failed to fetch the playlist.');
        const data = await response.text();

        // Extract URLs, names, and logos from the M3U data
        const urls = data.match(/^https?.*/gm) || [];
        const names = data.match(/^#EXTINF:.*?,(.*)/gm).map(line => line.replace(/^#EXTINF:.*?,/, '')) || [];
        const logos = (data.match(/tvg-logo="([^"]*)"/gm) || []).map(line => line.replace(/tvg-logo="([^"]*)"/, '$1'));

        console.log(`Processing ${urls.length} channels from playlist.`);

        // Controlled concurrency to handle network requests
        const results = await Promise.all(urls.map((url, index) => {
            return isChannelOnline(url).then(isOnline => {
                if (isOnline) {
                    return { label: names[index], type: 'm3u8', url: url, logo: logos[index] || 'thumbnail.jpg' };
                }
                return null;
            }).catch(error => {
                console.error('Error during channel check:', error);
                return null;
            });
        }));

        // Filter out null results and add valid channels to videoSources
        videoSources = videoSources.concat(results.filter(source => source !== null));
        console.log(`${videoSources.length} channels are currently online and have been added to the sources.`);
    } catch (error) {
        console.error(`Error fetching M3U playlist from ${m3uUrl}:`, error);
    }
};

// Function to initialize fetching channels
const initializeChannelFetching = () => {
    console.log('Starting to fetch channels from M3U URLs...');
    m3uUrls.forEach(url => fetchM3UChannels(url));
};

// Start the process
initializeChannelFetching();
