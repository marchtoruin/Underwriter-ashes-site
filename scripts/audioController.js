class AudioController {
    constructor() {
        this.audioContext = null;
        this.audioElement = document.getElementById('audioPlayer');
        this.playButton = document.getElementById('playButton');
        this.analyser = null;
        this.dataArray = null;
        this.isPlaying = false;
        this.onBeatCallback = null;

        this.setupAudioContext();
        this.setupEventListeners();
    }

    setupAudioContext() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512; // Reduced for more responsive analysis
        this.analyser.smoothingTimeConstant = 0.4; // Faster response time
        
        const source = this.audioContext.createMediaElementSource(this.audioElement);
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }

    setupEventListeners() {
        this.playButton.addEventListener('click', () => this.togglePlay());
        this.audioElement.addEventListener('ended', () => this.handlePlaybackEnd());
    }

    togglePlay() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        if (this.isPlaying) {
            this.audioElement.pause();
            this.playButton.classList.remove('playing');
        } else {
            this.audioElement.play();
            this.playButton.classList.add('playing');
        }

        this.isPlaying = !this.isPlaying;
    }

    handlePlaybackEnd() {
        this.isPlaying = false;
        this.playButton.classList.remove('playing');
    }

    getAudioData() {
        this.analyser.getByteFrequencyData(this.dataArray);
        return this.dataArray;
    }

    getAverageFrequency() {
        const data = this.getAudioData();
        return data.reduce((acc, val) => acc + val, 0) / data.length;
    }

    getBassFrequency() {
        const data = this.getAudioData();
        // Focus on low-mid frequencies for deathcore (including some guitar frequencies)
        const bassRange = data.slice(0, 40);
        const avg = bassRange.reduce((acc, val) => acc + val, 0) / bassRange.length;
        // Normalize and enhance the response
        return Math.pow(avg / 255, 0.7) * 255; // More responsive to quieter sections
    }

    setOnBeatCallback(callback) {
        this.onBeatCallback = callback;
    }

    update() {
        if (!this.isPlaying) return;

        const bass = this.getBassFrequency();
        const threshold = 80; // Lower threshold for more frequent triggers

        if (bass > threshold && this.onBeatCallback) {
            this.onBeatCallback(bass);
        }

        requestAnimationFrame(() => this.update());
    }
}

// Export the controller
window.AudioController = AudioController; 