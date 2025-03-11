class AudioController {
    constructor() {
        this.audioContext = null;
        this.audioElement = document.getElementById('audioPlayer');
        this.playButton = document.getElementById('playButton');
        this.analyser = null;
        this.dataArray = null;
        this.isPlaying = false;
        this.onBeatCallback = null;
        
        // Direct album art glow setup
        this.albumArt = document.querySelector('.album-art');
        this.albumImage = document.querySelector('.album-art img');
        this.lastGlowIntensity = 0;
        this.glowThreshold = 20;
        this.glowSmoothing = 0.3;
        
        // Bind methods
        this.togglePlay = this.togglePlay.bind(this);
        this.handlePlaybackEnd = this.handlePlaybackEnd.bind(this);
        this.update = this.update.bind(this);
        
        // Only set up the ended event listener
        this.audioElement.addEventListener('ended', this.handlePlaybackEnd);
    }

    async setupAudioContext() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                // Create and configure analyser
                this.analyser = this.audioContext.createAnalyser();
                this.analyser.fftSize = 512; // Increased for better frequency resolution
                this.analyser.smoothingTimeConstant = 0.4; // Smoother transitions
                
                const source = this.audioContext.createMediaElementSource(this.audioElement);
                source.connect(this.analyser);
                this.analyser.connect(this.audioContext.destination);
                
                this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            }
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            return true;
        } catch (error) {
            console.error('Failed to initialize audio system:', error);
            return false;
        }
    }

    async togglePlay() {
        try {
            if (this.isPlaying) {
                await this.audioElement.pause();
                this.isPlaying = false;
                // Reset album art glow when paused
                this.updateAlbumGlow(0);
            } else {
                if (!this.audioContext) {
                    const success = await this.setupAudioContext();
                    if (!success) {
                        throw new Error('Failed to initialize audio system');
                    }
                }

                if (this.audioContext.state === 'suspended') {
                    await this.audioContext.resume();
                }

                await this.audioElement.play();
                this.isPlaying = true;
                // Start the update loop for audio analysis
                this.update();
            }
        } catch (error) {
            console.error('Error toggling playback:', error);
            throw error; // Re-throw to handle in the main click handler
        }
    }

    handlePlaybackEnd() {
        this.isPlaying = false;
        this.playButton.classList.remove('playing');
        // Reset album art glow when playback ends
        this.updateAlbumGlow(0);
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
        // Focus more on the lowest frequencies (kick drum) for deathcore
        const bassRange = data.slice(0, 20); // Reduced from 40 to focus more on kick drum frequencies
        const avg = bassRange.reduce((acc, val) => acc + val, 0) / bassRange.length;
        
        // For deathcore: only react to the highest peaks (big kick drum hits)
        // Apply an even higher threshold to filter out everything but the heaviest hits
        const threshold = 190; // Increased from 180 to be more selective
        const normalizedValue = avg > threshold ? 
            ((avg - threshold) / (255 - threshold)) * 255 : 0;
            
        return normalizedValue;
    }

    setOnBeatCallback(callback) {
        this.onBeatCallback = callback;
    }

    update() {
        if (!this.isPlaying || !this.analyser) return;
        
        // Get fresh audio data and analyze
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Focus more on the lowest frequencies (kick drum) for deathcore
        const bassRange = this.dataArray.slice(0, 20); // Reduced from 40 to focus more on kick drum
        const bassSum = bassRange.reduce((a, b) => a + b, 0);
        const bassAvg = bassSum / bassRange.length;
        
        // For deathcore: apply a higher threshold to only react to big kick drum hits
        const threshold = 190; // Increased from 180 to be more selective
        let normalizedBass = 0;
        
        if (bassAvg > threshold) {
            // Only react to values above threshold with more dramatic curve
            normalizedBass = Math.pow((bassAvg - threshold) / (255 - threshold), 0.4); // Changed from 0.5 for more dramatic response
        }
        
        // Calculate glow intensity with more dramatic peaks
        const targetIntensity = Math.min(1, normalizedBass * 1.5); // Increased from 1.2 for more dramatic effect on big hits
        
        // Use asymmetric smoothing with nearly instantaneous attack and slower release
        const attackSmoothing = 0.98; // Keep the same instantaneous attack
        const releaseSmoothing = 0.5; // Reduced from 0.7 for slower release
        
        // Apply asymmetric smoothing based on whether intensity is increasing or decreasing
        if (targetIntensity > this.lastGlowIntensity) {
            // Almost instantaneous attack when intensity is increasing
            this.lastGlowIntensity = this.lastGlowIntensity * (1 - attackSmoothing) + 
                                    targetIntensity * attackSmoothing;
        } else {
            // Slower release when intensity is decreasing
            this.lastGlowIntensity = this.lastGlowIntensity * (1 - releaseSmoothing) + 
                                    targetIntensity * releaseSmoothing;
        }

        // Add a lower minimum intensity for more contrast
        const finalIntensity = Math.max(0.1, this.lastGlowIntensity);
        
        // Update album art glow
        this.updateAlbumGlow(finalIntensity);
        
        // Call onBeatCallback if set with peak detection
        if (this.onBeatCallback) {
            // Only send significant peaks to the particle system
            const peakIntensity = bassAvg > threshold ? bassAvg : 0;
            this.onBeatCallback(peakIntensity);
        }
        
        // Continue updating
        requestAnimationFrame(() => this.update());
    }

    updateAlbumGlow(intensity) {
        // Apply glow directly to the album art
        if (intensity > 0.15) { // Higher threshold for visibility change
            // Calculate shadow blur based on intensity with more immediate effect
            const blurAmount = Math.floor(40 + (intensity * 80)); // Increased from 30 + 70 for bigger radius
            const spreadAmount = Math.floor(15 + (intensity * 40)); // Increased from 10 + 30 for bigger radius
            
            // Calculate color intensity with more immediate effect
            const redValue = Math.min(255, Math.floor(220 + (intensity * 35))); // Keep the same brightness
            const alphaValue = Math.min(0.7, 0.6 + (intensity * 0.1)); // Reduced from 0.8 + 0.2 for lower opacity
            
            // Create more fluid color transitions using sine waves for smooth cycling
            const timePhase = Date.now() / 3000; // Slower cycle for more fluid transitions
            
            // Use sine waves for smooth transitions between colors
            const redPhase = Math.sin(timePhase * Math.PI * 2);
            const greenPhase = Math.sin((timePhase + 0.33) * Math.PI * 2);
            const bluePhase = Math.sin((timePhase + 0.66) * Math.PI * 2);
            
            // Map sine values (-1 to 1) to color ranges
            const red = redValue; // Keep red at max for all colors
            const green = Math.max(0, Math.floor(100 * (greenPhase * 0.5 + 0.5))); // 0-100 range
            const blue = Math.max(0, Math.floor(150 * (bluePhase * 0.5 + 0.5))); // 0-150 range
            
            // Apply box shadow for glow effect with no transition for instant response
            this.albumArt.style.transition = 'none'; // Remove transition for instant response
            this.albumArt.style.boxShadow = `0 0 ${blurAmount}px ${spreadAmount}px rgba(${red}, ${green}, ${blue}, ${alphaValue})`;
            
            // Add a more immediate scale effect based on intensity
            this.albumImage.style.transition = 'none'; // Remove transition for instant response
            this.albumImage.style.transform = `scale(${1 + (intensity * 0.06)})`;
            
            // Add a more immediate brightness filter
            this.albumImage.style.filter = `brightness(${1 + (intensity * 0.4)})`;
        } else {
            // Reset styles when intensity is too low
            this.albumArt.style.boxShadow = '0 0 50px rgba(0, 0, 0, 0.5)';
            this.albumImage.style.transform = 'scale(1)';
            this.albumImage.style.filter = 'brightness(1)';
        }
    }
}

// Export the controller
window.AudioController = AudioController; 