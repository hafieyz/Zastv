document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('player');
    const selectButton = document.getElementById('selectButton');
    const videoSelect = document.getElementById('videoSelect');
    const spinner = document.getElementById('spinner');
    
    const player = new Plyr(video, {
        controls: [
            'play-large', 'restart', 'rewind', 'play', 'fast-forward', 
            'progress', 'current-time', 'duration', 'mute', 'volume', 
            'captions', 'settings', 'pip', 'airplay', 'download', 'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed', 'loop'],
    });

    // Populate the dropdown menu with video sources
    videoSources.forEach(source => {
        const option = document.createElement('option');
        option.value = `${source.type}|${source.url}`;
        option.textContent = source.label;
        videoSelect.appendChild(option);
    });

    const initializePlayer = (type, url) => {
        spinner.style.display = 'block';
        video.style.display = 'none';

        if (type === 'mpd' && typeof dashjs !== 'undefined' && dashjs.MediaPlayer) {
            const dashPlayer = dashjs.MediaPlayer().create();
            dashPlayer.initialize(video, url, true);
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
        } else if (type === 'm3u8' && typeof Hls !== 'undefined' && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
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
        } else if (type === 'm3u8' && video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url;
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

    selectButton.addEventListener('click', () => {
        const selectedValue = videoSelect.value;
        if (selectedValue) {
            const [type, url] = selectedValue.split('|');
            initializePlayer(type, url);
        } else {
            alert('Please select a video.');
        }
    });
});
