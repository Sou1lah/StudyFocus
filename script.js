class StudyTimer {
    constructor() {
        // Timer configuration (in seconds)
        this.modes = {
            study: 25 * 60,       // 25 minutes (Classic Pomodoro)
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
        this.sessionData = []; // Track sessions by tag

        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
        this.loadStats();
        this.loadTags();
        this.displayTags();
        this.loadSessionData();
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
        this.alarmSound = document.getElementById('alarmSound');
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

        // Timer completion modal elements
        this.timerCompletionModal = document.getElementById('timerCompletionModal');
        this.continueStudyBtn = document.getElementById('continueStudyBtn');
        this.takeBreakBtn = document.getElementById('takeBreakBtn');
        this.takeLongBreakBtn = document.getElementById('takeLongBreakBtn');
        this.stopAlarmBtn = document.getElementById('stopAlarmBtn');
        this.completionMessage = document.getElementById('completionMessage');
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

        // Timer completion modal listeners
        this.continueStudyBtn.addEventListener('click', () => this.handleCompletionChoice('study'));
        this.takeBreakBtn.addEventListener('click', () => this.handleCompletionChoice('break'));
        this.takeLongBreakBtn.addEventListener('click', () => this.handleCompletionChoice('longbreak'));
        this.stopAlarmBtn.addEventListener('click', () => this.stopAlarm());

        // Close completion modal when clicking on backdrop or outside
        document.addEventListener('click', (e) => {
            if (e.target === this.timerCompletionModal || e.target.classList.contains('modal-backdrop')) {
                this.closeCompletionModal();
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
            if (this.timeLeft > 0) {
                this.timeLeft--;
            }
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
            study: '',
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
        this.timerDisplay.classList.remove('running');

        // Play alarm sound
        this.playAlarmSound();

        // Update stats if it's a study session
        if (this.currentMode === 'study') {
            this.sessionCount++;
            this.totalFocusTime += this.modes.study;
            
            // Track session by tag
            if (this.selectedTag) {
                this.trackSessionByTag(this.selectedTag.id, this.modes.study);
            }
            this.updateStats();
        }

        // Show completion dialog
        this.showCompletionDialog();
    }

    showCompletionDialog() {
        const messages = {
            study: 'Great work! What would you like to do next?',
            break: 'Ready to get back to studying?',
            longbreak: 'Hope you had a good break!'
        };

        this.completionMessage.textContent = messages[this.currentMode];
        this.timerCompletionModal.style.display = 'flex';
        
        // Reset vanish animation for new cycle
        const gifWrapper = document.querySelector('.alarm-gif-wrapper');
        const stopBtn = document.querySelector('.stop-alarm-main');
        if (gifWrapper) gifWrapper.classList.remove('vanish');
        if (stopBtn) stopBtn.classList.remove('vanish');
        
        // Add vibration to stop alarm button
        this.stopAlarmBtn.classList.add('vibrating');
        this.stopAlarmBtn.disabled = false;
    }

    closeCompletionModal() {
        this.timerCompletionModal.style.display = 'none';
        this.stopAlarmBtn.classList.remove('vibrating');
    }

    handleCompletionChoice(mode) {
        this.stopAlarm();
        this.closeCompletionModal();
        this.switchMode(mode);
        this.reset();
    }

    stopAlarm() {
        this.alarmSound.pause();
        this.alarmSound.currentTime = 0;
        this.stopAlarmBtn.classList.remove('vibrating');
        this.stopAlarmBtn.classList.add('vanish');
        this.stopAlarmBtn.disabled = true;
        
        const gifWrapper = document.querySelector('.alarm-gif-wrapper');
        if (gifWrapper) {
            gifWrapper.classList.add('vanish');
        }
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

    playAlarmSound() {
        try {
            // Play the iPhone alarm sound
            this.alarmSound.currentTime = 0;
            this.alarmSound.play().catch(error => {
                console.log('Could not play alarm sound:', error);
            });
        } catch (e) {
            console.log('Alarm sound could not be played');
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

    trackSessionByTag(tagId, timeInSeconds) {
        const today = new Date().toDateString();
        
        // Find existing entry for this tag and date
        let entry = this.sessionData.find(
            session => session.tagId === tagId && session.date === today
        );
        
        if (entry) {
            entry.totalTime += timeInSeconds;
        } else {
            entry = {
                tagId: tagId,
                date: today,
                totalTime: timeInSeconds
            };
            this.sessionData.push(entry);
        }
        
        this.saveSessionData();
    }

    saveSessionData() {
        localStorage.setItem('sessionData', JSON.stringify(this.sessionData));
    }

    loadSessionData() {
        const saved = localStorage.getItem('sessionData');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.sessionData = Array.isArray(data) ? data : [];
            } catch (e) {
                console.error('Error loading session data:', e);
                this.sessionData = [];
            }
        }
    }

    getTodaysSessions() {
        const today = new Date().toDateString();
        return this.sessionData.filter(session => {
            const sessionDate = new Date(session.date).toDateString();
            return sessionDate === today;
        });
    }

    getStudyStatsByTag() {
        const stats = {};
        const todaysSessions = this.getTodaysSessions();
        
        todaysSessions.forEach(session => {
            const tag = this.tags.find(t => t.id === session.tagId);
            if (tag) {
                if (!stats[tag.id]) {
                    stats[tag.id] = {
                        name: tag.name,
                        color: tag.color,
                        totalTime: 0
                    };
                }
                stats[tag.id].totalTime += session.totalTime;
            }
        });
        
        return Object.values(stats).sort((a, b) => b.totalTime - a.totalTime);
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
    let musicVolume = parseInt(localStorage.getItem('musicVolume')) || 70;
    let weatherSoundVolume = parseInt(localStorage.getItem('weatherSoundVolume')) || 50;
    let youtubePlayer = null;
    
    // Add Time and Skip button functionality
    const addTimeBtn = document.getElementById('addTimeBtn');
    const skipBtn = document.getElementById('skipBtn');
    
    addTimeBtn.addEventListener('click', () => {
        if (timer.isRunning || timer.timeLeft > 0) {
            timer.timeLeft += 5 * 60; // Add 5 minutes
            timer.updateDisplay();
        }
    });
    
    skipBtn.addEventListener('click', () => {
        if (timer.currentMode === 'study') {
            // If in study, go to break
            timer.switchMode('break');
        } else {
            // If in break or long break, go to study
            timer.switchMode('study');
        }
    });
    
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
    const musicVolumeSlider = document.getElementById('musicVolumeSlider');
    const weatherVolumeSlider = document.getElementById('weatherVolumeSlider');
    const musicVolumeValue = document.getElementById('musicVolumeValue');
    const weatherVolumeValue = document.getElementById('weatherVolumeValue');
    
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
    
    // Volume Controls in Settings
    // Volume Controls in Settings
    musicVolumeSlider.addEventListener('input', (e) => {
        musicVolume = parseInt(e.target.value);
        musicVolumeValue.textContent = musicVolume + '%';
        localStorage.setItem('musicVolume', musicVolume);
        // Apply volume to YouTube player if available
        if (youtubePlayer && typeof youtubePlayer.setVolume === 'function') {
            youtubePlayer.setVolume(musicVolume);
        }
    });
    
    weatherVolumeSlider.addEventListener('input', (e) => {
        weatherSoundVolume = parseInt(e.target.value);
        weatherVolumeValue.textContent = weatherSoundVolume + '%';
        localStorage.setItem('weatherSoundVolume', weatherSoundVolume);
        // Apply volume to weather sounds if available
        if (currentAudio && !currentAudio.paused) {
            currentAudio.volume = weatherSoundVolume / 100;
        }
    });
    
    // Initialize sliders with saved values
    musicVolumeSlider.value = musicVolume;
    musicVolumeValue.textContent = musicVolume + '%';
    weatherVolumeSlider.value = weatherSoundVolume;
    weatherVolumeValue.textContent = weatherSoundVolume + '%';
    
    // Stats Modal functionality
    const statsBtn = document.getElementById('statsBtn');
    const statsModal = document.getElementById('statsModal');
    const closeStatsBtn = document.getElementById('closeStatsBtn');
    const todayStatsContainer = document.getElementById('todayStatsContainer');
    const totalStatsContainer = document.getElementById('totalStatsContainer');
    const todayStatsContent = document.getElementById('todayStatsContent');
    const totalStatsContent = document.getElementById('totalStatsContent');
    const statsTabs = document.querySelectorAll('.stats-tab');

    const showStatsModal = () => {
        updateStatsDisplay();
        statsModal.classList.add('active');
    };

    const hideStatsModal = () => {
        statsModal.classList.remove('active');
    };

    const updateStatsDisplay = () => {
        // Update today's stats
        const stats = timer.getStudyStatsByTag();
        
        // Create hourly chart data
        const hourlyData = getHourlyStudyData();
        
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
            displayHourlyChart(hourlyData);
        }, 100);
        
        if (stats.length === 0) {
            todayStatsContent.innerHTML = '<p style="text-align: center; color: #999; margin-top: 20px;">No study sessions yet today</p>';
        } else {
            todayStatsContent.innerHTML = stats.map(stat => {
                const hours = Math.floor(stat.totalTime / 3600);
                const minutes = Math.floor((stat.totalTime % 3600) / 60);
                const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
                
                return `
                    <div class="stat-item">
                        <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
                            <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${stat.color};"></div>
                            <span style="font-weight: 500;">${stat.name}</span>
                        </div>
                        <span style="color: #aaa;">${timeStr}</span>
                    </div>
                `;
            }).join('');
        }
        
        // Total stats - display stats cards and heatmap
        displayTotalStats();
    };

    const displayTotalStats = () => {
        const totalHours = Math.floor(timer.totalFocusTime / 3600);
        const totalMinutes = Math.floor((timer.totalFocusTime % 3600) / 60);
        const sessionCount = timer.sessionCount || 0;
        
        // Create stats cards HTML
        const statsCardsHTML = `
            <div class="stats-grid">
                <div class="stats-card" style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);">
                    <div class="stats-card-label">Current Streak</div>
                    <div class="stats-card-value">1</div>
                    <div class="stats-card-unit">DAY</div>
                </div>
                <div class="stats-card" style="background: linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%);">
                    <div class="stats-card-label">Best Streak</div>
                    <div class="stats-card-value">1</div>
                    <div class="stats-card-unit">DAY</div>
                </div>
                <div class="stats-card" style="background: linear-gradient(135deg, #10B981 0%, #34D399 100%);">
                    <div class="stats-card-label">Total hours</div>
                    <div class="stats-card-value">${totalHours}h ${totalMinutes}m</div>
                    <div class="stats-card-unit plus-badge">
                        <i class="fas fa-plus"></i> Plus
                    </div>
                </div>
                <div class="stats-card" style="background: linear-gradient(135deg, #A855F7 0%, #D946EF 100%);">
                    <div class="stats-card-label">Pomodoros<br>Completed</div>
                    <div class="stats-card-value">${sessionCount}</div>
                </div>
                <div class="stats-card" style="background: linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%);">
                    <div class="stats-card-label">This Week</div>
                    <div class="stats-card-value">${sessionCount}</div>
                    <div class="stats-card-unit">POMODOROS</div>
                </div>
                <div class="stats-card" style="background: linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%);">
                    <div class="stats-card-label">Daily average</div>
                    <div class="stats-card-value">0h 0m</div>
                    <div class="stats-card-unit plus-badge">
                        <i class="fas fa-plus"></i> Plus
                    </div>
                </div>
            </div>
        `;
        
        totalStatsContent.innerHTML = statsCardsHTML;
        
        // Generate and display heatmap
        displayHeatmap();
    };

    const displayHeatmap = () => {
        const heatmapContent = document.getElementById('heatmapContent');
        
        if (!heatmapContent) return;
        
        const daysPerWeek = 7;
        const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        const weeksCount = 26;
        const weeksPerMonth = 4;
        
        // Generate activity data for last 26 weeks
        const activityData = {};
        timer.sessionData.forEach(session => {
            const date = new Date(session.date);
            const dateStr = date.toDateString();
            const day = date.getDay();
            
            const key = `${dateStr}-${day}`;
            if (!activityData[key]) {
                activityData[key] = 0;
            }
            
            if (session.endTime) {
                const duration = (session.endTime - session.date) / 1000 / 60;
                activityData[key] += duration;
            }
        });
        
        let heatmapHTML = '<div class="heatmap-wrapper-github">';
        
        // Day labels on the left
        heatmapHTML += '<div class="heatmap-left-labels">';
        dayLabels.forEach(day => {
            heatmapHTML += `<div class="heatmap-day-label-left">${day}</div>`;
        });
        heatmapHTML += '</div>';
        
        // Main heatmap grid
        heatmapHTML += '<div class="heatmap-main-container">';
        
        // Month labels on top (every 4 columns)
        heatmapHTML += '<div class="heatmap-top-labels">';
        const today = new Date();
        const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        
        for (let w = 0; w < weeksCount; w++) {
            if (w % weeksPerMonth === 0) {
                const monthIndex = (sixMonthsAgo.getMonth() + Math.floor(w / weeksPerMonth)) % 12;
                heatmapHTML += `<div class="heatmap-month-label-spacer">${monthLabels[monthIndex]}</div>`;
            } else {
                heatmapHTML += `<div class="heatmap-month-label-spacer"></div>`;
            }
        }
        heatmapHTML += '</div>';
        
        // Heatmap grid using CSS Grid (github style)
        heatmapHTML += '<div class="heatmap-grid-github">';
        
        // Generate all cells in grid order (left to right, top to bottom)
        let currentDate = new Date(sixMonthsAgo);
        const startDay = currentDate.getDay();
        currentDate.setDate(currentDate.getDate() - (startDay || 7) + 1);
        
        for (let week = 0; week < weeksCount; week++) {
            for (let day = 0; day < daysPerWeek; day++) {
                const dateStr = currentDate.toDateString();
                const key = `${dateStr}-${day}`;
                const minutes = activityData[key] || 0;
                
                let color = '#1f2937'; // No activity
                if (minutes > 0 && minutes <= 30) {
                    color = '#10b981'; // Light green
                } else if (minutes > 30) {
                    color = '#059669'; // Dark green
                }
                
                heatmapHTML += `<div class="heatmap-cell" style="background-color: ${color};" title="${Math.round(minutes)} min"></div>`;
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        heatmapHTML += '</div>';
        heatmapHTML += '</div>';
        heatmapHTML += '</div>';
        heatmapContent.innerHTML = heatmapHTML;
    };

    // Get hourly study data for today
    let todayChart = null;
    
    const getHourlyStudyData = () => {
        const now = new Date();
        const today = now.toDateString();
        const hourlyData = new Array(24).fill(0);
        
        // Go through today's sessions and collect data
        const todaysSessions = timer.getTodaysSessions();
        todaysSessions.forEach(session => {
            if (session.endTime) {
                const hour = new Date(session.date).getHours();
                const duration = (session.endTime - session.date) / 1000 / 60; // in minutes
                hourlyData[hour] += duration;
            }
        });
        
        return hourlyData;
    };

    const displayHourlyChart = (hourlyData) => {
        const chartCanvas = document.getElementById('todayChart');
        const chartContainer = document.getElementById('todayChartContainer');
        
        if (!chartCanvas) {
            console.error('Chart canvas not found');
            return;
        }
        
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }
        
        // Show the container
        chartContainer.style.display = 'block';
        
        // Create time labels
        const labels = [];
        for (let i = 0; i < 24; i++) {
            const period = i < 12 ? 'AM' : 'PM';
            const displayHour = i === 0 ? 12 : (i > 12 ? i - 12 : i);
            labels.push(`${displayHour}:00 ${period}`);
        }
        
        // Convert minutes to hours for display
        const dataInHours = hourlyData.map(minutes => parseFloat((minutes / 60).toFixed(2)));
        
        // Destroy existing chart if it exists
        if (todayChart) {
            todayChart.destroy();
        }
        
        try {
            // Get canvas context
            const ctx = chartCanvas.getContext('2d');
            
            // Create new chart
            todayChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Hours Studied',
                        data: dataInHours,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1,
                        borderRadius: 4,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)',
                                drawBorder: true
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                font: {
                                    size: 12
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                font: {
                                    size: 10
                                }
                            }
                        }
                    }
                }
            });
            console.log('Chart created successfully');
            // Force chart resize
            setTimeout(() => {
                if (todayChart && todayChart.resize) {
                    todayChart.resize();
                }
            }, 200);
        } catch (error) {
            console.error('Error creating chart:', error);
        }
    };

    // Tab switching for stats
    statsTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            statsTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.stats-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            tab.classList.add('active');
            const tabName = tab.dataset.tab;
            document.getElementById(`${tabName}StatsContainer`).classList.add('active');
        });
    });

    statsBtn.addEventListener('click', showStatsModal);
    closeStatsBtn.addEventListener('click', hideStatsModal);

    // Close stats modal when clicking outside
    statsModal.addEventListener('click', (e) => {
        if (e.target === statsModal) {
            hideStatsModal();
        }
    });
    
    // Focus Mode Toggle
    focusBtn.addEventListener('click', () => {
        document.body.classList.toggle('focus-mode');
        focusBtn.classList.toggle('active');
        muteBtn.style.display = document.body.classList.contains('focus-mode') ? 'flex' : 'none';
    });
    
    // Track which external services were active before muting
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
    
    // Custom Preset Modal functionality
    const customPresetModal = document.getElementById('customPresetModal');
    const closeCustomPresetBtn = document.getElementById('closeCustomPresetBtn');
    const cancelCustomPresetBtn = document.getElementById('cancelCustomPresetBtn');
    const saveCustomPresetBtn = document.getElementById('saveCustomPresetBtn');
    const customPresetName = document.getElementById('customPresetName');
    const customStudyTime = document.getElementById('customStudyTime');
    const customBreakTime = document.getElementById('customBreakTime');
    const customLongBreakTime = document.getElementById('customLongBreakTime');
    const addPresetBtn = document.querySelector('.add-preset');
    const MAX_CUSTOM_PRESETS = 3;

    // Function to load custom presets from localStorage
    function loadCustomPresetsFromStorage() {
        const customPresets = JSON.parse(localStorage.getItem('customPresets')) || [];
        const presetDivider = document.querySelector('.preset-divider');
        
        // Remove existing custom presets
        document.querySelectorAll('.preset-item.custom-preset').forEach(item => item.remove());
        
        // Add custom presets to the menu
        customPresets.forEach((preset, index) => {
            const presetItem = document.createElement('div');
            presetItem.className = 'preset-item custom-preset';
            presetItem.setAttribute('data-study', preset.study);
            presetItem.setAttribute('data-break', preset.breakTime);
            presetItem.setAttribute('data-longbreak', preset.longbreak);
            
            const studyMin = preset.study / 60;
            const breakMin = preset.breakTime / 60;
            const longbreakMin = preset.longbreak / 60;
            
            presetItem.innerHTML = `
                <span>${preset.name} <span class="preset-time">${studyMin}m · ${breakMin}m · ${longbreakMin}m</span></span>
                <button class="preset-delete-btn" data-index="${index}" style="background: none; border: none; color: rgba(255, 255, 255, 0.6); cursor: pointer; font-size: 14px; padding: 0 5px;">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;
            
            presetDivider.parentElement.insertBefore(presetItem, presetDivider);
        });
        
        // Reattach event listeners for custom presets
        attachCustomPresetListeners();
    }

    // Function to attach event listeners to custom presets
    function attachCustomPresetListeners() {
        const customPresetItems = document.querySelectorAll('.preset-item.custom-preset');
        
        // Preset selection
        customPresetItems.forEach(item => {
            const deleteBtn = item.querySelector('.preset-delete-btn');
            
            item.addEventListener('click', (e) => {
                if (e.target.closest('.preset-delete-btn')) return;
                
                document.querySelectorAll('.preset-item').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                
                const study = parseInt(item.getAttribute('data-study'));
                const breakTime = parseInt(item.getAttribute('data-break'));
                const longbreak = parseInt(item.getAttribute('data-longbreak'));
                
                timer.modes.study = study;
                timer.modes.break = breakTime;
                timer.modes.longbreak = longbreak;
                timer.currentMode = 'study';
                timer.updateActiveModeButton();
                timer.reset();
                
                const presetLabel = item.querySelector('span').textContent;
                document.getElementById('presetLabel').textContent = presetLabel;
                
                presetMenu.classList.remove('active');
            });
            
            // Delete button
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(deleteBtn.getAttribute('data-index'));
                let customPresets = JSON.parse(localStorage.getItem('customPresets')) || [];
                customPresets.splice(index, 1);
                localStorage.setItem('customPresets', JSON.stringify(customPresets));
                loadCustomPresetsFromStorage();
            });
        });
    }

    // Load custom presets on page load
    loadCustomPresetsFromStorage();

    addPresetBtn.addEventListener('click', () => {
        const customPresets = JSON.parse(localStorage.getItem('customPresets')) || [];
        if (customPresets.length >= MAX_CUSTOM_PRESETS) {
            alert(`Maximum ${MAX_CUSTOM_PRESETS} custom presets allowed. Please delete one first.`);
            return;
        }
        customPresetModal.classList.add('active');
        presetMenu.classList.remove('active');
    });
    
    closeCustomPresetBtn.addEventListener('click', () => {
        customPresetModal.classList.remove('active');
    });
    
    cancelCustomPresetBtn.addEventListener('click', () => {
        customPresetModal.classList.remove('active');
    });
    
    customPresetModal.addEventListener('click', (e) => {
        if (e.target === customPresetModal) {
            customPresetModal.classList.remove('active');
        }
    });
    
    saveCustomPresetBtn.addEventListener('click', () => {
        const name = customPresetName.value.trim();
        const study = parseInt(customStudyTime.value) * 60;
        const breakTime = parseInt(customBreakTime.value) * 60;
        const longbreak = parseInt(customLongBreakTime.value) * 60;
        
        if (!name) {
            alert('Please enter a preset name');
            return;
        }
        
        // Save to localStorage with max 3 limit
        let customPresets = JSON.parse(localStorage.getItem('customPresets')) || [];
        if (customPresets.length >= MAX_CUSTOM_PRESETS) {
            alert(`Maximum ${MAX_CUSTOM_PRESETS} custom presets allowed.`);
            return;
        }
        
        customPresets.push({ name, study, breakTime, longbreak });
        localStorage.setItem('customPresets', JSON.stringify(customPresets));
        
        // Apply the preset immediately
        timer.modes.study = study;
        timer.modes.break = breakTime;
        timer.modes.longbreak = longbreak;
        timer.currentMode = 'study';
        timer.updateActiveModeButton();
        timer.reset();
        
        // Update UI
        document.getElementById('presetLabel').textContent = `${name} ${customStudyTime.value}m · ${customBreakTime.value}m · ${customLongBreakTime.value}m`;
        
        // Reset form
        customPresetName.value = '';
        customStudyTime.value = '25';
        customBreakTime.value = '5';
        customLongBreakTime.value = '15';
        
        customPresetModal.classList.remove('active');
        
        // Reload custom presets in the menu
        loadCustomPresetsFromStorage();
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
    const seaVideo = document.getElementById('seaVideo');
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
        seaVideo.style.display = 'none';
        document.body.classList.remove('ocean-bg', 'ocean-video-bg', 'rain-video-bg', 'sea-video-bg');
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
        
        // Pause sea video
        if (seaVideo) {
            seaVideo.pause();
            seaVideo.currentTime = 0;
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
        } else if (bgType === 'sea') {
            // Sea video background - start playing
            document.body.classList.add('sea-video-bg');
            seaVideo.style.display = 'block';
            seaVideo.play().catch(e => {
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
        
        // Handle audio/music muting - mute all audio elements including notification sounds
        const allAudioElements = document.querySelectorAll('audio');
        allAudioElements.forEach(audio => {
            audio.muted = isMuted;
            if (!isMuted && audio.paused && audio.src) {
                // Resume playing if it was paused and we're unmuting
                audio.play().catch(e => console.log('Audio play error:', e));
            }
        });
        
        // Mute/Unmute YouTube Lofi player
        if (youtubePlayer && typeof youtubePlayer.mute === 'function') {
            if (isMuted) {
                youtubePlayer.mute();
            } else {
                youtubePlayer.unMute();
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
        currentAudio.volume = weatherSoundVolume / 100;
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

// YouTube IFrame Player API initialization - MUST be outside the main script scope
window.onYouTubeIframeAPIReady = function() {
    youtubePlayer = new YT.Player('lofiPlayer', {
        width: '100%',
        height: '400',
        videoId: 'nv_2rz5BFDA',  // Lofi music video ID
        playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            showinfo: 0
        },
        events: {
            onReady: function(event) {
                // Set initial volume when player is ready
                youtubePlayer.setVolume(musicVolume);
            }
        }
    });
};
