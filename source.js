const videoSources = [
    { label: 'DASH', type: 'mpd', url: 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd' },
    { label: 'HLS', type: 'm3u8', url: 'https://d25tgymtnqzu8s.cloudfront.net/smil:berita/playlist.m3u8?id=5' }
    // Additional sources can be added here
];

// Fetch and add M3U channels
fetch('https://iptv-org.github.io/iptv/countries/my.m3u')
    .then(response => response.text())
    .then(data => {
        const urls = data.match(/^https?.*/gm);
        const names = data.match(/^#EXTINF:.*?,(.*)/gm).map(line => line.replace(/^#EXTINF:.*?,/, ''));

        urls.forEach((url, index) => {
            videoSources.push({ label: names[index], type: 'm3u8', url: url });
        });
    })
    .catch(error => console.error('Error fetching M3U playlist:', error));