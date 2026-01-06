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

        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
        this.loadStats();
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
    }

    attachEventListeners() {
        this.startBtn.addEventListener('click', () => this.toggleStartPause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.modeStudyBtn.addEventListener('click', () => this.switchMode('study'));
        this.modeBreakBtn.addEventListener('click', () => this.switchMode('break'));
        this.modeLongBreakBtn.addEventListener('click', () => this.switchMode('longbreak'));
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
            study: '📚 Studying',
            break: '☕ Taking a break',
            longbreak: '🌟 Long break time'
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
}

// Initialize timer when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const timer = new StudyTimer();
    
    // Settings modal functionality
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
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

    // Coming Soon Modal functionality for Background and Weather
    const comingSoonModal = document.getElementById('comingSoonModal');
    const backgroundBtn = document.getElementById('backgroundBtn');
    const weatherBtn = document.getElementById('weatherBtn');
    const comingSoonClose = document.getElementById('comingSoonClose');

    const showComingSoon = () => {
        comingSoonModal.classList.add('active');
    };

    const hideComingSoon = () => {
        comingSoonModal.classList.remove('active');
    };

    musicBtn.addEventListener('click', showComingSoon);
    backgroundBtn.addEventListener('click', showComingSoon);
    weatherBtn.addEventListener('click', showComingSoon);
    comingSoonClose.addEventListener('click', hideComingSoon);

    // Close modal when clicking outside
    comingSoonModal.addEventListener('click', (e) => {
        if (e.target === comingSoonModal) {
            hideComingSoon();
        }
    });
});
