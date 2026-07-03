/* ==========================================================================
   DERAU KELABU WEBSITE LOGIC (INTERACTIONS, CUSTOM AUDIO PLAYER, ANIMATIONS)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- NAVIGATION & STICKY HEADER ---
    const header = document.querySelector('.site-header');
    const navToggle = document.getElementById('nav-toggle-btn');
    const navMenu = document.getElementById('nav-menu-wrapper');
    const navLinks = document.querySelectorAll('.nav-link');

    // Sticky Header on Scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        highlightActiveSection();
    });

    // Mobile Hamburger Menu Toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('open');
        navMenu.classList.toggle('open');
    });

    // Close Menu on Link Click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('open');
            navMenu.classList.remove('open');
        });
    });

    // Highlight Active Link on Scroll
    const sections = document.querySelectorAll('section[id]');
    function highlightActiveSection() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(current => {
            const sectionHeight = current.offsetHeight;
            const sectionTop = current.offsetTop - 120; // Offset for sticky header
            const sectionId = current.getAttribute('id');
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                document.querySelector(`.nav-menu a[href*=${sectionId}]`)?.classList.add('active');
            } else {
                document.querySelector(`.nav-menu a[href*=${sectionId}]`)?.classList.remove('active');
            }
        });
    }

    // --- CUSTOM AUDIO PLAYER ---
    const audio = document.getElementById('main-audio');
    const playerWrapper = document.getElementById('audio-player-wrapper');
    const playPauseBtn = document.getElementById('btn-play-pause');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const volumeBtn = document.getElementById('btn-volume');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeIconSvg = document.getElementById('volume-icon-svg');
    const playlistItems = document.querySelectorAll('.playlist-item');
    const playerTrackTitle = document.getElementById('player-track-title');

    let currentTrackIndex = 0;
    let isPlaying = false;

    // Load selected track
    function loadTrack(index) {
        playlistItems.forEach(item => item.classList.remove('active'));
        const selectedItem = playlistItems[index];
        selectedItem.classList.add('active');

        const trackSrc = selectedItem.getAttribute('data-src');
        const trackName = selectedItem.querySelector('.playlist-track-name').textContent;
        const trackDuration = selectedItem.getAttribute('data-duration');

        audio.src = trackSrc;
        playerTrackTitle.textContent = trackName;
        totalDurationEl.textContent = trackDuration;
        currentTimeEl.textContent = '0:00';
        progressBar.style.setProperty('--progress-pct', '0%');
        
        currentTrackIndex = index;
    }

    // Play Track
    function playTrack() {
        isPlaying = true;
        playerWrapper.classList.add('playing');
        playIcon.classList.add('hide');
        pauseIcon.classList.remove('hide');
        
        // Handle playback (preventing DOM errors if source loading fails)
        audio.play().catch(err => {
            console.log("Audio playback error (can happen offline):", err);
            // Simulate playing UI even if audio fails to load offline
            simulateOfflinePlayback();
        });
    }

    // Pause Track
    function pauseTrack() {
        isPlaying = false;
        playerWrapper.classList.remove('playing');
        playIcon.classList.remove('hide');
        pauseIcon.classList.add('hide');
        audio.pause();
        if (offlineInterval) clearInterval(offlineInterval);
    }

    // Toggle Play/Pause
    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    });

    // Next Track
    nextBtn.addEventListener('click', () => {
        let nextIndex = currentTrackIndex + 1;
        if (nextIndex >= playlistItems.length) {
            nextIndex = 0;
        }
        loadTrack(nextIndex);
        if (isPlaying) playTrack();
    });

    // Prev Track
    prevBtn.addEventListener('click', () => {
        let prevIndex = currentTrackIndex - 1;
        if (prevIndex < 0) {
            prevIndex = playlistItems.length - 1;
        }
        loadTrack(prevIndex);
        if (isPlaying) playTrack();
    });

    // Update Progress Bar
    function updateProgress(e) {
        if (!isPlaying) return;
        const { duration, currentTime } = e.srcElement;
        if (isNaN(duration)) return;
        
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.setProperty('--progress-pct', `${progressPercent}%`);
        
        // Update Time text
        currentTimeEl.textContent = formatTime(currentTime);
    }

    // Format seconds to MM:SS
    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        let seconds = Math.floor(time % 60);
        if (seconds < 10) {
            seconds = `0${seconds}`;
        }
        return `${minutes}:${seconds}`;
    }

    // Set Audio Progress on Click
    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        
        if (isNaN(duration)) {
            // Offline simulation fallback click handling
            if (offlineDuration) {
                offlineCurrentTime = (clickX / width) * offlineDuration;
                progressBar.style.setProperty('--progress-pct', `${(offlineCurrentTime / offlineDuration) * 100}%`);
                currentTimeEl.textContent = formatTime(offlineCurrentTime);
            }
            return;
        }
        audio.currentTime = (clickX / width) * duration;
    }

    // Volume Adjustment
    volumeSlider.addEventListener('input', (e) => {
        const volumeVal = e.target.value;
        audio.volume = volumeVal;
        audio.muted = (volumeVal === '0');
        updateVolumeIcon(volumeVal, audio.muted);
    });

    // Mute Button Toggle
    volumeBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        updateVolumeIcon(audio.volume, audio.muted);
    });

    function updateVolumeIcon(val, isMuted) {
        if (isMuted || val == 0) {
            // Mute Icon SVG
            volumeIconSvg.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
        } else {
            // Normal Icon SVG
            volumeIconSvg.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
        }
    }

    // Playlist Item Clicking
    playlistItems.forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.getAttribute('data-index'));
            loadTrack(index);
            playTrack();
        });
    });

    // Auto-advance Playlist when song ends
    audio.addEventListener('ended', () => {
        nextBtn.click();
    });

    audio.addEventListener('timeupdate', updateProgress);
    progressContainer.addEventListener('click', setProgress);

    // Initial Load
    loadTrack(0);

    // --- OFFLINE SIMULATION FALLBACK ---
    // In case the network is slow or SoundHelix CDN is blocked, we simulate player timing.
    let offlineInterval = null;
    let offlineCurrentTime = 0;
    let offlineDuration = 0;

    function simulateOfflinePlayback() {
        if (offlineInterval) clearInterval(offlineInterval);
        
        // Parse track duration string e.g. "6:12" into seconds
        const timeParts = totalDurationEl.textContent.split(':');
        offlineDuration = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);
        
        offlineInterval = setInterval(() => {
            if (offlineCurrentTime >= offlineDuration) {
                clearInterval(offlineInterval);
                offlineCurrentTime = 0;
                nextBtn.click();
                return;
            }
            offlineCurrentTime++;
            const pct = (offlineCurrentTime / offlineDuration) * 100;
            progressBar.style.setProperty('--progress-pct', `${pct}%`);
            currentTimeEl.textContent = formatTime(offlineCurrentTime);
        }, 1000);
    }

    // --- REVEAL ON SCROLL ANIMATIONS ---
    const revealElements = [
        document.querySelector('.about-content'),
        document.querySelector('.about-image-wrapper'),
        document.querySelector('.music-player-container'),
        document.querySelector('.playlist-container'),
        document.querySelector('.contact-info'),
        document.querySelector('.contact-form-container')
    ];
    
    // Add member cards & gig rows to reveal elements
    document.querySelectorAll('.member-card').forEach(el => revealElements.push(el));
    document.querySelectorAll('.gig-row').forEach(el => revealElements.push(el));

    // Initialize reveal classes
    revealElements.forEach(el => {
        if (el) el.classList.add('reveal');
    });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target); // Animates once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        if (el) revealObserver.observe(el);
    });

    // --- GIG TICKET ALERT MOCK ---
    const ticketBtns = document.querySelectorAll('.gig-ticket-btn');
    ticketBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const eventName = btn.getAttribute('data-event');
            alert(`Anda diarahkan ke sistem loket mitra kami untuk pembelian tiket "${eventName}". Terimakasih telah mendukung musisi lokal!`);
        });
    });

    // --- CONTACT FORM SUBMIT HANDLER ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status-message');

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get values
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const subject = document.getElementById('contact-subject').value;
        const message = document.getElementById('contact-message').value;

        // Visual loading state
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'MENGIRIM...';
        formStatus.textContent = '';
        formStatus.className = 'form-status';

        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            formStatus.textContent = `Terima kasih, ${name}! Pesan Anda mengenai "${subject}" berhasil dikirim. Kami akan membalas ke ${email} secepatnya.`;
            formStatus.classList.add('success');
            
            // Reset form
            contactForm.reset();
        }, 1500);
    });
});
