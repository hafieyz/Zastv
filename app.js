document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('player');
    const playButton = document.getElementById('playButton');
    const spinner = document.getElementById('spinner');
    
    const player = new Plyr(video, {
        controls: [
            'play-large', 'restart', 'rewind', 'play', 'fast-forward', 
            'progress', 'current-time', 'duration', 'mute', 'volume', 
            'captions', 'settings', 'pip', 'airplay', 'download', 'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed', 'loop'],
    });

    const dashManifest = 'https://bitmovin-a.akamaihd.net/content/sintel/sintel.mpd';
    const hlsManifest = 'path/to/your/playlist.m3u8';

    const initializePlayer = () => {
        spinner.style.display = 'block';
        video.style.display = 'none';

        if (typeof dashjs !== 'undefined' && dashjs.MediaPlayer) {
            const dashPlayer = dashjs.MediaPlayer().create();
            dashPlayer.initialize(video, dashManifest, true);
            dashPlayer.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, () => {
                spinner.style.display = 'none';
                video.style.display = 'block';
                video.play().catch(error => console.error('Error playing video:', error));
            });
            dashPlayer.on(dashjs.MediaPlayer.events.ERROR, (e) => {
                console.error('Dash.js error:', e);
                spinner.style.display = 'none';
                alert('Failed to load DASH stream.');
            });
        } else if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(hlsManifest);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                spinner.style.display = 'none';
                video.style.display = 'block';
                video.play().catch(error => console.error('Error playing video:', error));
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    console.error('Hls.js fatal error:', data);
                    spinner.style.display = 'none';
                    alert('Failed to load HLS stream.');
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = hlsManifest;
            video.addEventListener('loadedmetadata', () => {
                spinner.style.display = 'none';
                video.style.display = 'block';
                video.play().catch(error => console.error('Error playing video:', error));
            });
            video.addEventListener('error', () => {
                spinner.style.display = 'none';
                alert('Failed to load HLS stream.');
            });
        } else {
            spinner.style.display = 'none';
            alert('No supported stream type found.');
        }
    };

    playButton.addEventListener('click', () => {
        initializePlayer();
        playButton.style.display = 'none';  // Hide the button after it's clicked
    });
});
