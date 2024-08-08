document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('player');
    const spinner = document.getElementById('spinner');
    const epgContainer = document.getElementById('epg-container');
    const channelNameElement = document.getElementById('channel-name');
    const epgTooltip = document.getElementById('epg-tooltip'); // Tooltip element

    let epgData = [];
    let epgIndex = 0;
    const epgBatchSize = 10;

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
        nextBatch.forEach((program) => {
            try {
                const title = program.querySelector('title')?.textContent || 'No Title';
                const startAttr = program.getAttribute('start');
                const stopAttr = program.getAttribute('stop');
                const start = parseEPGDate(startAttr);
                const stop = parseEPGDate(stopAttr);

                if (!isNaN(start.getTime()) && !isNaN(stop.getTime()) && stop >= now) {
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

                    if (now >= start && now <= stop) {
                        epgItem.classList.add('current-epg');
                        const currentPlayingText = document.createElement('div');
                        currentPlayingText.classList.add('current-playing-text');
                        currentPlayingText.textContent = 'Current Playing';
                        epgItem.prepend(currentPlayingText);

                        // Update tooltip with current EPG show details
                        epgTooltip.textContent = `${title} (${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${stop.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
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
                const stop = parseEPGDate(program.getAttribute('stop'));
                return stop >= now && program.getAttribute('channel') === channelName;
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
        root: epgContainer,
        threshold: 1.0
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
    
        const handlePlayerError = (error) => {
            console.error('Player error:', error);
            spinner.style.display = 'none';
            alert(`Failed to load ${type.toUpperCase()} stream.`);
        };
    
        const handlePlayerSuccess = () => {
            spinner.style.display = 'none';
            video.style.display = 'block';
            video.play().catch(error => console.error('Error playing video:', error));
        };
    
        const initializeDashPlayer = () => {
            const dashPlayer = dashjs.MediaPlayer().create();
            dashPlayer.initialize(video, url, true);
            dashPlayer.on(dashjs.MediaPlayer.events.STREAM_INITIALIZED, handlePlayerSuccess);
            dashPlayer.on(dashjs.MediaPlayer.events.ERROR, handlePlayerError);
        };
    
        const initializeHlsPlayer = () => {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, handlePlayerSuccess);
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('Network error:', data);
                            alert('Network error occurred. Please check your connection.');
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('Media error:', data);
                            if (data.details === 'bufferAppendError') {
                                console.error('Buffer append error:', data);
                                alert('Buffer append error occurred. Attempting to recover.');
                                hls.recoverMediaError();
                            }
                            break;
                        default:
                            handlePlayerError(data);
                            break;
                    }
                }
            });
        };
            const initializeNativePlayer = (type) => {
                video.src = url;
                video.addEventListener('loadedmetadata', handlePlayerSuccess);
                video.addEventListener('error', handlePlayerError);
            };
        
            switch (type) {
                case 'mpd':
                    if (typeof dashjs !== 'undefined' && dashjs.MediaPlayer) {
                        initializeDashPlayer();
                    } else {
                        handlePlayerError(new Error('DASH.js not available.'));
                    }
                    break;
                case 'm3u8':
                    if (typeof Hls !== 'undefined' && Hls.isSupported()) {
                        initializeHlsPlayer();
                    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        initializeNativePlayer('application/vnd.apple.mpegurl');
                    } else {
                        handlePlayerError(new Error('No supported player for HLS.'));
                    }
                    break;
                case 'aac':
                    if (video.canPlayType('audio/aac')) {
                        initializeNativePlayer('audio/aac');
                    } else {
                        handlePlayerError(new Error('AAC not supported.'));
                    }
                    break;
                default:
                    handlePlayerError(new Error('Unsupported stream type.'));
                    break;
            }
        
            // Display the current channel name
            channelNameElement.textContent = channelName;
        
            // Display EPG for the selected channel
            displayEPG(channelName);
        };
        
        // Function to create and add video cards
        const createVideoCards = () => {
            const sourceGroups = videoSources.reduce((groups, source) => {
                if (!groups[source.sourceId]) {
                    groups[source.sourceId] = [];
                }
                groups[source.sourceId].push(source);
                return groups;
            }, {});
        
            Object.keys(sourceGroups).forEach(sourceId => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('card-slider-wrapper');
        
                const header = document.createElement('div');
                header.classList.add('card-slider-header');
        
                const title = document.createElement('div');
                title.classList.add('card-slider-title');
                title.textContent = `${sourceId}`;
        
                header.appendChild(title);
                wrapper.appendChild(header);
        
                const container = document.createElement('div');
                container.classList.add('card-slider-container');
        
                const slider = document.createElement('div');
                slider.classList.add('card-slider');
        
                sourceGroups[sourceId].forEach(source => {
                    const card = document.createElement('div');
                    card.classList.add('card');
                    card.innerHTML = `
                        <img src="${source.logo || 'thumbnail.jpg'}" alt="${source.label}" />
                        <div class="card-content">
                            <div class="live-badge">LIVE</div>
                        </div>
                    `;
                    card.addEventListener('click', () => {
                        initializePlayer(source.type, source.url, source.label);
                    });
                    slider.appendChild(card);
                });
        
                container.appendChild(slider);
                wrapper.appendChild(container);
                document.getElementById('sliders-container').appendChild(wrapper);
            });
        };
        
        // Show loading animation
        const showLoading = () => {
            spinner.style.display = 'block';
        };
        
        // Hide loading animation
        const hideLoading = () => {
            spinner.style.display = 'none';
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
        
        // Event listeners to show/hide the tooltip
        video.addEventListener('mouseenter', () => {
            epgTooltip.style.display = 'block';
        });
        
        video.addEventListener('mouseleave', () => {
            epgTooltip.style.display = 'none';
        });
    });