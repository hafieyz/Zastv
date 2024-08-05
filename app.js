document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('player');
    const videoCards = document.getElementById('videoCards');
    const spinner = document.getElementById('spinner');
    const loadingContainer = document.getElementById('loadingContainer');
    const epgContainer = document.getElementById('epg-container');
    const channelNameElement = document.getElementById('channel-name'); // New element for channel name

    let epgData = [];
    let epgIndex = 0;
    const epgBatchSize = 15;

    const player = new Plyr(video, {
        controls: [
            'play-large', 'restart', 'rewind', 'play', 'fast-forward', 
            'progress', 'current-time', 'duration', 'mute', 'volume', 
            'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed', 'loop'],
        fullscreen: { enabled: true, fallback: true, iosNative: true }
    });


    // Function to parse EPG date string
    const parseEPGDate = (dateString) => {
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6) - 1;
        const day = dateString.substring(6, 8);
        const hours = dateString.substring(8, 10);
        const minutes = dateString.substring(10, 12);
        const seconds = dateString.substring(12, 14);
        return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
    };

    // Function to fetch EPG data
    const fetchEPG = async () => {
        try {
            const response = await fetch('https://raw.githubusercontent.com/AqFad2811/epg/main/epg.xml');
            const text = await response.text();
            const parser = new DOMParser();
            return parser.parseFromString(text, 'application/xml');
        } catch (error) {
            console.error('Error fetching EPG:', error);
        }
    };

    // Function to load more EPG data
    const loadMoreEPG = () => {
        const now = new Date();
        const nextBatch = epgData.slice(epgIndex, epgIndex + epgBatchSize);
        nextBatch.forEach((program, index) => {
            try {
                const title = program.querySelector('title')?.textContent || 'No Title';
                const startAttr = program.getAttribute('start');
                const stopAttr = program.getAttribute('stop');
                const start = parseEPGDate(startAttr);
                const stop = parseEPGDate(stopAttr);

                if (!isNaN(start.getTime()) && !isNaN(stop.getTime()) && start >= now) {
                    const epgItem = document.createElement('div');
                    epgItem.classList.add('epg-item');

                    const epgTitle = document.createElement('div');
                    epgTitle.classList.add('epg-title');
                    epgTitle.textContent = title;

                    const epgTime = document.createElement('div');
                    epgTime.classList.add('epg-time');
                    epgTime.textContent = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${stop.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                    epgItem.appendChild(epgTitle);
                    epgItem.appendChild(epgTime);
                    epgContainer.appendChild(epgItem);

                    if (index === 0) {
                        const currentPlayingText = document.createElement('div');
                        currentPlayingText.classList.add('current-playing-text');
                        currentPlayingText.textContent = 'Current Playing';
                        epgItem.prepend(currentPlayingText);
                        epgItem.classList.add('current-epg');
                    } else if (index === 1) {
                        const comingNextText = document.createElement('div');
                        comingNextText.classList.add('coming-next-text');
                        comingNextText.textContent = 'Coming Next';
                        epgItem.prepend(comingNextText);
                        epgItem.classList.add('coming-next');
                    }

                    if (now >= start && now <= stop) {
                        epgItem.classList.add('current-epg');
                    }
                } else {
                    console.warn('Invalid start or stop time for program:', program);
                    console.log('Raw start attribute:', startAttr);
                    console.log('Raw stop attribute:', stopAttr);
                    console.log('Parsed start time:', start);
                    console.log('Parsed stop time:', stop);
                }
            } catch (error) {
                console.error('Error processing EPG program:', program, error);
            }
        });
        epgIndex += epgBatchSize;
    };

    // Function to display EPG for the selected channel from current date and time onward
    const displayEPG = (channelName) => {
        epgContainer.innerHTML = '';
        epgIndex = 0;

        fetchEPG().then(xml => {
            const programs = xml.querySelectorAll('programme');
            const now = new Date();
            epgData = Array.from(programs).filter(program => {
                const start = parseEPGDate(program.getAttribute('start'));
                return start >= now && program.getAttribute('channel') === channelName;
            }).sort((a, b) => parseEPGDate(a.getAttribute('start')) - parseEPGDate(b.getAttribute('start')));
            loadMoreEPG();
        });
    };

    // Intersection observer for lazy loading EPG
    const observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
            loadMoreEPG();
        }
    }, {
        root: epgContainer,    threshold: 1.0
    });
    
    const sentinel = document.createElement('div');
    sentinel.style.height = '1px';
    sentinel.style.width = '100%';
    epgContainer.appendChild(sentinel);
    observer.observe(sentinel);
    
    // Initialize player and display EPG for the selected channel
    const initializePlayer = (type, url, channelName) => {
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
    
        // Display the current channel name
        channelNameElement.textContent = channelName;
    
        // Display EPG for the selected channel
        displayEPG(channelName);
    };
    
    // Function to create and add video cards
    const createVideoCards = () => {
        videoSources.forEach(source => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.innerHTML = `
                <img src="${source.logo || 'thumbnail.jpg'}" alt="${source.label}" />
                <div class="card-content">
                    <div class="live-badge">LIVE</div> <!-- Add this line for the LIVE badge -->
                </div>
            `;
            card.addEventListener('click', () => {
                initializePlayer(source.type, source.url, source.label);
            });
            videoCards.appendChild(card);
        });
    };
    
    // Show loading animation
    const showLoading = () => {
        loadingContainer.style.display = 'flex';
    };
    
    // Hide loading animation
    const hideLoading = () => {
        loadingContainer.style.display = 'none';
    };
    
    // Wait for videoSources to be populated
    const waitForSources = () => {
        if (videoSources.length > 2) {
            hideLoading();
            createVideoCards();
        } else {
            setTimeout(waitForSources, 500);
        }
    };
    
    showLoading();
    waitForSources();
    
    

});