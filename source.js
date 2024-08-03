const videoSources = [
    { label: 'DASH', type: 'mpd', url: 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd' },
    { label: 'HLS', type: 'm3u8', url: 'https://d25tgymtnqzu8s.cloudfront.net/smil:berita/playlist.m3u8?id=5' }
    // Additional sources can be added here
];

const m3uUrls = [
    'https://iptv-org.github.io/iptv/countries/my.m3u',
    //'https://iptv-org.github.io/iptv/countries/us.m3u'
    // Add more M3U URLs here
];

// Function to check if the channel is online
const isChannelOnline = async (url) => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.error('Error checking channel availability:', error);
        return false;
    }
};

// Function to fetch and process M3U channels
const fetchM3UChannels = async (m3uUrl) => {
    try {
        const response = await fetch(m3uUrl);
        const data = await response.text();
        const urls = data.match(/^https?.*/gm);
        const names = data.match(/^#EXTINF:.*?,(.*)/gm).map(line => line.replace(/^#EXTINF:.*?,/, ''));
        const logos = data.match(/tvg-logo="([^"]*)"/gm).map(line => line.replace(/tvg-logo="([^"]*)"/, '$1'));

        for (let index = 0; index < urls.length; index++) {
            const url = urls[index];
            const isOnline = await isChannelOnline(url);
            if (isOnline) {
                videoSources.push({ label: names[index], type: 'm3u8', url: url, logo: logos[index] || 'thumbnail.jpg' });
            }
        }
    } catch (error) {
        console.error('Error fetching M3U playlist:', error);
    }
};

// Fetch channels from all M3U URLs
m3uUrls.forEach(fetchM3UChannels);