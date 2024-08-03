document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('player');
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

    if (typeof dashjs !== 'undefined' && dashjs.MediaPlayer) {
        const dashPlayer = dashjs.MediaPlayer().create();
        dashPlayer.initialize(video, dashManifest, true);
    } else if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(hlsManifest);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play();
        });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsManifest;
        video.addEventListener('loadedmetadata', () => {
            video.play();
        });
    }
});
