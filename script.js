class StudyTimer {
    constructor() {
        // Timer configuration (in seconds)
        this.modes = {
            study: 90 * 60,       // 90 minutes
            break: 5 * 60,        // 5 minutes
            longbreak: 15 * 60    // 15 minutes
        };

        this.timeLeft = this.modes.study;
        this.isRunning = false;
        this.currentMode = 'study';
        this.sessionCount = 0;
        this.totalFocusTime = 0;
        this.timerInterval = null;
        
        // Tags initialization
        this.tags = [];
        this.selectedColor = '#3B82F6';

        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
        this.loadStats();
        this.loadTags();
        this.displayTags();
    }

    initializeElements() {
        this.timerDisplay = document.getElementById('timerDisplay');
        this.startBtn = document.getElementById('startBtn');
        this.startBtnText = document.getElementById('startBtnText');
        this.resetBtn = document.getElementById('resetBtn');
        this.modeStudyBtn = document.getElementById('modeStudy');
        this.modeBreakBtn = document.getElementById('modeBreak');
        this.modeLongBreakBtn = document.getElementById('modeLongBreak');
        this.sessionStatus = document.getElementById('sessionStatus');
        this.notificationSound = document.getElementById('notificationSound');
        this.dots = [
            document.getElementById('dot1'),
            document.getElementById('dot2'),
            document.getElementById('dot3')
        ];
        
        // Tags elements
        this.tagsDisplay = document.getElementById('tagsDisplay');
        this.tagDropdownBtn = document.getElementById('tagDropdownBtn');
        this.tagDropdownMenu = document.getElementById('tagDropdownMenu');
        this.tagMenuItems = document.getElementById('tagMenuItems');
        this.tagAddOption = document.getElementById('tagAddOption');
        this.selectedTagText = document.getElementById('selectedTagText');
        this.addTagModal = document.getElementById('addTagModal');
        this.closeAddTagBtn = document.getElementById('closeAddTagBtn');
        this.tagNameInput = document.getElementById('tagNameInput');
        this.createTagBtn = document.getElementById('createTagBtn');
        this.cancelAddTagBtn = document.getElementById('cancelAddTagBtn');
        this.colorOptions = document.querySelectorAll('.color-option');
        this.selectedTag = null;
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleStartPause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.modeStudyBtn.addEventListener('click', () => this.switchMode('study'));
        this.modeBreakBtn.addEventListener('click', () => this.switchMode('break'));
        this.modeLongBreakBtn.addEventListener('click', () => this.switchMode('longbreak'));
        
        // Tags event listeners
        this.tagDropdownBtn.addEventListener('click', () => this.toggleDropdown());
        this.tagAddOption.addEventListener('click', () => this.openAddTagModal());
        this.closeAddTagBtn.addEventListener('click', () => this.closeAddTagModal());
        this.cancelAddTagBtn.addEventListener('click', () => this.closeAddTagModal());
        this.createTagBtn.addEventListener('click', () => this.createTag());
        this.tagNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createTag();
        });
        
        // Color selection
        this.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.colorOptions.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedColor = option.dataset.color;
            });
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.tag-dropdown-wrapper')) {
                this.closeDropdown();
            }
        });
        
        // Close modal when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target === this.addTagModal) {
                this.closeAddTagModal();
            }
        });
    }

    toggleDropdown() {
        if (this.tagDropdownMenu.style.display === 'none') {
            this.openDropdown();
        } else {
            this.closeDropdown();
        }
    }

    openDropdown() {
        this.displayTags();
        this.tagDropdownMenu.style.display = 'block';
        this.tagDropdownBtn.classList.add('active');
    }

    closeDropdown() {
        this.tagDropdownMenu.style.display = 'none';
        this.tagDropdownBtn.classList.remove('active');
    }

    openAddTagModal() {
        this.closeDropdown();
        this.addTagModal.style.display = 'flex';
        this.tagNameInput.focus();
        this.colorOptions[0].classList.add('selected');
        this.selectedColor = '#3B82F6';
    }

    closeAddTagModal() {
        this.addTagModal.style.display = 'none';
        this.tagNameInput.value = '';
        this.colorOptions.forEach(opt => opt.classList.remove('selected'));
    }

    toggleStartPause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    switchMode(mode) {
        if (!this.isRunning) {
            this.currentMode = mode;
            this.updateActiveModeButton();
            this.reset();
        }
    }

    updateActiveModeButton() {
        this.modeStudyBtn.classList.toggle('active', this.currentMode === 'study');
        this.modeBreakBtn.classList.toggle('active', this.currentMode === 'break');
        this.modeLongBreakBtn.classList.toggle('active', this.currentMode === 'longbreak');
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.startBtn.disabled = true;
        this.startBtnText.textContent = 'Pause';
        this.startBtn.innerHTML = '<i class="fas fa-pause"></i> <span id="startBtnText">Pause</span>';
        this.startBtn.disabled = false;
        this.timerDisplay.classList.add('running');

        this.updateSessionStatus();

        this.timerInterval = setInterval(() => {
            this.timeLeft--;
            this.updateDisplay();

            if (this.timeLeft <= 0) {
                this.completeSession();
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> <span id="startBtnText">Start</span>';
        this.timerDisplay.classList.remove('running');
        this.updateSessionStatus();
    }

    reset() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.timeLeft = this.modes[this.currentMode];
        this.startBtn.innerHTML = '<i class="fas fa-play"></i> <span id="startBtnText">Start</span>';
        this.timerDisplay.classList.remove('running');
        this.updateDisplay();
        this.updateSessionStatus();
    }

    updateDisplay() {
        const hours = Math.floor(this.timeLeft / 3600);
        const minutes = Math.floor((this.timeLeft % 3600) / 60);
        const seconds = this.timeLeft % 60;
        
        let timeString;
        if (hours > 0) {
            timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        
        this.timerDisplay.textContent = timeString;

        // Update page title
        document.title = `${timeString} - StudyFocus`;
    }

    updateSessionStatus() {
        const modeLabels = {
            study: 'Studying',
            break: 'Taking a break',
            longbreak: 'Long break time'
        };

        if (this.isRunning) {
            this.sessionStatus.textContent = `${modeLabels[this.currentMode]}`;
        } else if (this.timeLeft !== this.modes[this.currentMode]) {
            this.sessionStatus.textContent = `Paused - ${modeLabels[this.currentMode]}`;
        } else {
            this.sessionStatus.textContent = '';
        }
    }

    completeSession() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timerDisplay.classList.remove('running');

        // Play notification sound
        this.playNotification();

        if (this.currentMode === 'study') {
            this.sessionCount++;
            this.totalFocusTime += this.modes.study;
            this.showNotification('Great work! Take a break now.');
            this.switchMode('break');
        } else {
            this.showNotification(`Break time's over! Ready to focus again?`);
            // Alternate between short and long breaks
            if (this.sessionCount % 4 === 0) {
                this.switchMode('study');
            } else {
                this.switchMode('study');
            }
        }

        this.currentMode = this.modeSelect.value;
        this.reset();
        this.updateStats();
    }

    playNotification() {
        try {
            // Create a simple beep using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 1000;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Notification sound could not be played');
        }
    }

    showNotification(message) {
        const badge = document.createElement('div');
        badge.className = 'notification-badge';
        badge.textContent = message;
        document.body.appendChild(badge);

        setTimeout(() => {
            badge.remove();
        }, 3000);
    }

    updateStats() {
        const hours = Math.floor(this.totalFocusTime / 3600);
        const minutes = Math.floor((this.totalFocusTime % 3600) / 60);
        this.saveStats();
    }

    saveStats() {
        const stats = {
            date: new Date().toDateString(),
            sessionCount: this.sessionCount,
            totalFocusTime: this.totalFocusTime
        };
        localStorage.setItem('studyStats', JSON.stringify(stats));
    }

    loadStats() {
        const saved = localStorage.getItem('studyStats');
        if (saved) {
            const stats = JSON.parse(saved);
            // Reset if it's a new day
            if (stats.date !== new Date().toDateString()) {
                this.sessionCount = 0;
                this.totalFocusTime = 0;
            } else {
                this.sessionCount = stats.sessionCount || 0;
                this.totalFocusTime = stats.totalFocusTime || 0;
            }
        }
        this.updateStats();
    }

    // Tags Methods
    createTag() {
        const tagName = this.tagNameInput.value.trim();
        if (!tagName) {
            return;
        }

        const tag = {
            id: Date.now(),
            name: tagName,
            color: this.selectedColor,
            createdAt: new Date().toISOString()
        };

        this.tags.push(tag);
        this.saveTags();
        this.displayTags();
        this.closeAddTagModal();
    }

    removeTag(tagId) {
        this.tags = this.tags.filter(tag => tag.id !== tagId);
        if (this.selectedTag && this.selectedTag.id === tagId) {
            this.selectedTag = null;
            this.selectedTagText.textContent = 'Select a tag';
        }
        this.saveTags();
        this.displayTags();
    }

    displayTags() {
        this.tagMenuItems.innerHTML = '';
        
        if (this.tags.length === 0) {
            this.selectedTagText.textContent = 'Select a tag';
            return;
        }

        // Display all tags in dropdown
        this.tags.forEach(tag => {
            const menuItem = document.createElement('button');
            menuItem.className = 'tag-menu-item';
            menuItem.innerHTML = `
                <div class="tag-menu-item-color" style="background-color: ${tag.color}"></div>
                <span>${tag.name}</span>
                <button class="tag-delete-btn" data-tag-id="${tag.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Click on tag to select it
            const textSpan = menuItem.querySelector('span');
            textSpan.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectTag(tag);
            });
            
            // Delete button
            const deleteBtn = menuItem.querySelector('.tag-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeTag(tag.id);
            });
            
            this.tagMenuItems.appendChild(menuItem);
        });
    }

    selectTag(tag) {
        this.selectedTag = tag;
        this.selectedTagText.innerHTML = `
            <div style="display: inline-flex; align-items: center; gap: 6px;">
                <div style="width: 10px; height: 10px; border-radius: 50%; background-color: ${tag.color};"></div>
                ${tag.name}
            </div>
        `;
        this.closeDropdown();
    }

    saveTags() {
        localStorage.setItem('studyTags', JSON.stringify(this.tags));
    }

    loadTags() {
        const savedTags = localStorage.getItem('studyTags');
        if (savedTags) {
            this.tags = JSON.parse(savedTags);
        }
    }
}

// Initialize global sound state
window.soundMuted = false;

// Initialize timer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const timer = new StudyTimer();
    
    // Audio variables
    let currentAudio = null;
    let currentSound = null;
    
    // Settings modal functionality
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const focusBtn = document.getElementById('focusBtn');
    const muteBtn = document.getElementById('muteBtn');
    let isMuted = false;
    const modalTabs = document.querySelectorAll('.modal-tab');
    const presetBtn = document.getElementById('presetDropdownBtn');
    const presetMenu = document.getElementById('presetMenu');
    const presetItems = document.querySelectorAll('.preset-item:not(.add-preset)');
    const radioItems = document.querySelectorAll('.radio-item');
    
    // Open/Close Settings Modal
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('active');
    });
    
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });
    
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });
    
    // Focus Mode Toggle
    focusBtn.addEventListener('click', () => {
        document.body.classList.toggle('focus-mode');
        focusBtn.classList.toggle('active');
        muteBtn.style.display = document.body.classList.contains('focus-mode') ? 'flex' : 'none';
    });
    
    // Track which external services were active before muting
    let wasYouTubePlaying = false;
    let wasWeatherActive = false;
    
    // Mute button functionality will be initialized after focusSceneModal is defined
    
    // Tab switching
    modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Remove active from all tabs and contents
            modalTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.modal-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Add active to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(`${tabName}-content`).classList.add('active');
        });
    });
    
    // Preset dropdown functionality
    presetBtn.addEventListener('click', () => {
        presetMenu.classList.toggle('active');
    });
    
    // Close preset menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.preset-dropdown')) {
            presetMenu.classList.remove('active');
        }
    });
    
    // Preset selection
    presetItems.forEach(item => {
        item.addEventListener('click', () => {
            const studyTime = parseInt(item.dataset.study);
            const breakTime = parseInt(item.dataset.break);
            const longbreakTime = parseInt(item.dataset.longbreak);
            
            // Update timer modes
            timer.modes.study = studyTime;
            timer.modes.break = breakTime;
            timer.modes.longbreak = longbreakTime;
            
            // Update UI
            presetItems.forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            
            // Update label
            const presetLabel = item.textContent.split(/\d+m/)[0].trim();
            const times = item.querySelector('.preset-time').textContent;
            document.getElementById('presetLabel').textContent = `${presetLabel} ${times}`;
            
            // Reset timer
            timer.currentMode = 'study';
            timer.updateActiveModeButton();
            timer.reset();
            
            presetMenu.classList.remove('active');
        });
    });
    
    // Radio button functionality
    radioItems.forEach(item => {
        item.addEventListener('click', () => {
            radioItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Music Modal functionality
    const musicModal = document.getElementById('musicModal');
    const musicBtn = document.getElementById('musicBtn');
    const musicModalClose = document.getElementById('musicModalClose');

    const showMusicModal = () => {
        musicModal.classList.add('active');
    };

    const hideMusicModal = () => {
        musicModal.classList.remove('active');
    };

    musicBtn.addEventListener('click', showMusicModal);
    musicModalClose.addEventListener('click', hideMusicModal);

    // Close music modal when clicking outside
    musicModal.addEventListener('click', (e) => {
        if (e.target === musicModal) {
            hideMusicModal();
        }
    });
    // Background functionality
    const oceanBg = document.getElementById('oceanBg');
    const oceanVideo = document.getElementById('oceanVideo');
    const rainVideo = document.getElementById('rainVideo');
    const backgroundModal = document.getElementById('backgroundModal');
    const backgroundModalClose = document.getElementById('backgroundModalClose');
    const backgroundBtn = document.getElementById('backgroundBtn');
    const backgroundOptions = document.querySelectorAll('.background-option');
    let currentBackground = localStorage.getItem('selectedBg') || 'default';

    const showBackgroundModal = () => {
        backgroundModal.classList.add('active');
        updateBackgroundUI();
    };

    const hideBackgroundModal = () => {
        backgroundModal.classList.remove('active');
    };

    const updateBackgroundUI = () => {
        backgroundOptions.forEach(option => {
            const bg = option.dataset.bg;
            option.classList.toggle('active', bg === currentBackground);
        });
    };

    const selectBackground = (bgType) => {
        currentBackground = bgType;
        localStorage.setItem('selectedBg', bgType);
        
        // Reset all backgrounds
        oceanBg.style.display = 'none';
        oceanVideo.style.display = 'none';
        rainVideo.style.display = 'none';
        document.body.classList.remove('ocean-bg', 'ocean-video-bg', 'rain-video-bg');
        document.body.style.backgroundImage = 'none';
        
        // Stop tetris background
        hideTetrisBackground();
        
        // Pause ocean video
        if (oceanVideo) {
            oceanVideo.pause();
            oceanVideo.currentTime = 0;
        }
        
        // Pause rain video
        if (rainVideo) {
            rainVideo.pause();
            rainVideo.currentTime = 0;
        }
        
        // Stop wave animations
        const waves = document.querySelectorAll('.wave');
        waves.forEach(wave => {
            wave.style.animationPlayState = 'paused';
        });
        
        if (bgType === 'default') {
            // Default: just black screen
        } else if (bgType === 'tetris') {
            // Tetris: tetris blocks - start animation
            showTetrisBackground();
        } else if (bgType === 'waves') {
            // Waves: animated ocean waves with light gradient
            oceanBg.style.display = 'block';
            document.body.classList.add('ocean-bg');
            // Resume wave animations
            waves.forEach(wave => {
                wave.style.animationPlayState = 'running';
            });
        } else if (bgType === 'ocean') {
            // Ocean video background - start playing
            document.body.classList.add('ocean-video-bg');
            oceanVideo.style.display = 'block';
            oceanVideo.play().catch(e => {
                console.log('Video autoplay failed:', e);
            });
        } else if (bgType === 'rain') {
            // Rain video background - start playing
            document.body.classList.add('rain-video-bg');
            rainVideo.style.display = 'block';
            rainVideo.play().catch(e => {
                console.log('Video autoplay failed:', e);
            });
        }
        
        updateBackgroundUI();
    };

    // Load saved background preference
    selectBackground(currentBackground);

    backgroundBtn.addEventListener('click', showBackgroundModal);
    backgroundModalClose.addEventListener('click', hideBackgroundModal);
    
    backgroundOptions.forEach(option => {
        option.addEventListener('click', () => {
            selectBackground(option.dataset.bg);
        });
    });

    // Close background modal when clicking outside
    backgroundModal.addEventListener('click', (e) => {
        if (e.target === backgroundModal) {
            hideBackgroundModal();
        }
    });
    
    // Weather button
    const weatherBtn = document.getElementById('weatherBtn');
    
    // Coming Soon Modal functionality for Weather
    const comingSoonModal = document.getElementById('comingSoonModal');
    const comingSoonClose = document.getElementById('comingSoonClose');
    const focusSceneModal = document.getElementById('focusSceneModal');

    const showComingSoon = () => {
        comingSoonModal.classList.add('active');
    };

    const hideComingSoon = () => {
        comingSoonModal.classList.remove('active');
    };

    const showFocusScene = () => {
        focusSceneModal.classList.add('active');
    };

    const hideFocusScene = () => {
        focusSceneModal.classList.remove('active');
    };

    weatherBtn.addEventListener('click', showFocusScene);
    comingSoonClose.addEventListener('click', hideComingSoon);

    // Close modal when clicking outside
    comingSoonModal.addEventListener('click', (e) => {
        if (e.target === comingSoonModal) {
            hideComingSoon();
        }
    });

    // Focus Scene Modal functionality
    const focusSceneClose = document.getElementById('focusSceneClose');
    const sceneItems = document.querySelectorAll('.scene-item');

    focusSceneClose.addEventListener('click', hideFocusScene);

    focusSceneModal.addEventListener('click', (e) => {
        if (e.target === focusSceneModal) {
            hideFocusScene();
        }
    });

    // Mute button functionality - now that focusSceneModal is defined
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        muteBtn.classList.toggle('muted', isMuted);
        
        // Update icon
        if (isMuted) {
            muteBtn.querySelector('i').className = 'fas fa-volume-mute';
            muteBtn.title = 'Unmute Sound';
        } else {
            muteBtn.querySelector('i').className = 'fas fa-volume-up';
            muteBtn.title = 'Mute Sound';
        }
        
        // Mute the current audio element if playing
        if (currentAudio) {
            currentAudio.muted = isMuted;
        }
        
        // Handle audio/music muting - mute all audio elements
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.muted = isMuted;
            if (!isMuted && audio.paused && audio.src) {
                // Resume playing if it was paused and we're unmuting
                audio.play().catch(e => console.log('Audio play error:', e));
            }
        });
        
        // Handle YouTube player (pause/resume)
        const youtubeIframe = document.querySelector('iframe[src*="youtube"]');
        if (youtubeIframe) {
            if (isMuted) {
                // Check if YouTube is playing and pause it
                wasYouTubePlaying = true;
                youtubeIframe.style.opacity = '0.5';
                // Send pause command to YouTube iframe
                youtubeIframe.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: 'pauseVideo' }),
                    '*'
                );
            } else if (wasYouTubePlaying) {
                // Resume YouTube if it was playing
                youtubeIframe.style.opacity = '1';
                youtubeIframe.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: 'playVideo' }),
                    '*'
                );
            }
        }
        
        // Handle Weather modal (close if open)
        if (isMuted && focusSceneModal.classList.contains('active')) {
            wasWeatherActive = true;
            hideFocusScene();
        } else if (!isMuted && wasWeatherActive) {
            showFocusScene();
            wasWeatherActive = false;
        }
        
        // Store mute state for music player
        window.soundMuted = isMuted;
    });

    // Sound effects function
    const playSound = (soundType) => {
        // Stop current sound if playing
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        if (soundType === 'none') {
            currentSound = null;
            return;
        }

        // Create or reuse audio element
        if (!currentAudio) {
            currentAudio = new Audio();
            currentAudio.loop = true;
            currentAudio.crossOrigin = "anonymous";
        }

        // Map sounds to GitHub raw content URLs
        const soundMap = {
            'rain': 'https://raw.githubusercontent.com/Sou1lah/StudyFocus/main/assets/mixkit-light-rain-loop-2393.wav',
            'heavy-rain': 'https://raw.githubusercontent.com/Sou1lah/StudyFocus/main/assets/mixkit-heavy-rain-drops-2399.wav',
            'wind': 'https://raw.githubusercontent.com/Sou1lah/StudyFocus/main/assets/mixkit-wind-blowing-ambience-2658.wav',
            'waves': 'https://raw.githubusercontent.com/Sou1lah/StudyFocus/main/assets/mixkit-small-waves-harbor-rocks-1208.wav',
            'birds': 'https://raw.githubusercontent.com/Sou1lah/StudyFocus/main/assets/mixkit-little-birds-singing-in-the-trees-17.wav',
            'thunder': 'https://raw.githubusercontent.com/Sou1lah/StudyFocus/main/assets/mixkit-rain-and-thunder-storm-2390.wav',
            'night': 'https://raw.githubusercontent.com/Sou1lah/StudyFocus/main/assets/mixkit-night-forest-with-insects-2414.wav'
        };

        currentAudio.src = soundMap[soundType] || '';
        currentSound = soundType;
        currentAudio.volume = 0.5;
        currentAudio.muted = window.soundMuted || false;
        currentAudio.play().catch(e => {
            console.log('Audio playback failed:', e);
            // Fallback: show alert if audio fails
            alert('Unable to load sound. Please check if audio files are available.');
        });
    };

    // Scene item selection
    sceneItems.forEach(item => {
        item.addEventListener('click', () => {
            const soundType = item.dataset.sound;
            sceneItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            playSound(soundType);
        });
    });

    // Mark "None" as active initially
    document.getElementById('sceneNone').classList.add('active');

    // Todo List functionality
    const todoAddQuickBtn = document.getElementById('todoAddQuickBtn');
    const taskInputModal = document.getElementById('taskInputModal');
    const taskInputClose = document.getElementById('taskInputClose');
    const taskInputCancel = document.getElementById('taskInputCancel');
    const taskInputField = document.getElementById('taskInputField');
    const taskInputSubmit = document.getElementById('taskInputSubmit');
    const MAX_TODOS = 3;

    // Load todos from localStorage
    const loadTodos = () => {
        const saved = localStorage.getItem('studyTodos');
        return saved ? JSON.parse(saved) : [];
    };

    // Save todos to localStorage
    const saveTodos = (todos) => {
        localStorage.setItem('studyTodos', JSON.stringify(todos));
    };

    let todos = loadTodos();

    // Show task input modal
    const showTaskModal = () => {
        todos = loadTodos(); // Reload todos from localStorage
        taskInputModal.classList.add('active');
        taskInputField.value = '';
        taskInputField.focus();
        
        const taskMaxMessage = document.getElementById('taskMaxMessage');
        
        // Update submit button state and message
        if (todos.length >= MAX_TODOS) {
            taskInputSubmit.disabled = true;
            taskInputSubmit.textContent = 'Max Tasks Reached';
            taskMaxMessage.style.display = 'block';
            taskInputField.disabled = true;
        } else {
            taskInputSubmit.disabled = false;
            taskInputSubmit.textContent = 'Save';
            taskMaxMessage.style.display = 'none';
            taskInputField.disabled = false;
        }
    };

    // Display todos on the card
    const displayTodos = () => {
        const todoListContainer = document.getElementById('todoListContainer');
        const todoList = document.getElementById('todoList');
        
        // Always show the container
        todoListContainer.style.display = 'block';
        
        if (todos.length === 0) {
            todoList.innerHTML = '<div style="text-align: center; color: rgba(255, 255, 255, 0.4); padding: 20px; font-size: 14px;">No tasks yet. Click + to add one!</div>';
            return;
        }
        
        todoList.innerHTML = '';
        
        todos.forEach((todo, index) => {
            const todoItem = document.createElement('div');
            todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            todoItem.innerHTML = `
                <span class="todo-item-text">${todo.text}</span>
                <button class="todo-item-delete" data-index="${index}">Delete</button>
            `;
            
            todoList.appendChild(todoItem);
        });
        
        // Add delete listeners
        document.querySelectorAll('.todo-item-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                todos.splice(index, 1);
                saveTodos(todos);
                displayTodos();
            });
        });
    };

    // Hide task input modal
    const hideTaskModal = () => {
        taskInputModal.classList.remove('active');
        taskInputField.value = '';
        displayTodos(); // Refresh display when modal closes
    };

    // Add task from modal
    const addTaskFromModal = () => {
        if (todos.length >= MAX_TODOS) {
            return;
        }

        const text = taskInputField.value.trim();
        if (!text) {
            alert('Please enter a task!');
            return;
        }

        todos.push({ text, completed: false });
        saveTodos(todos);
        hideTaskModal();
    };

    // Clear all tasks
    const clearAllTasks = () => {
        if (confirm('Are you sure you want to delete all tasks?')) {
            todos = [];
            saveTodos(todos);
            hideTaskModal();
        }
    };

    // Event listeners
    todoAddQuickBtn.addEventListener('click', showTaskModal);
    taskInputClose.addEventListener('click', hideTaskModal);
    taskInputCancel.addEventListener('click', hideTaskModal);
    taskInputSubmit.addEventListener('click', addTaskFromModal);

    // Enter key to submit
    taskInputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !taskInputSubmit.disabled) {
            addTaskFromModal();
        }
    });

    // Close modal when clicking outside
    taskInputModal.addEventListener('click', (e) => {
        if (e.target === taskInputModal) {
            hideTaskModal();
        }
    });

    // Initialize - clear any stuck tasks on page load
    localStorage.removeItem('studyTodos');
    todos = [];
    displayTodos();
});
