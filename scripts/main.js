document.addEventListener('DOMContentLoaded', () => {
    // Initialize systems
    const audioController = new AudioController();
    const particleSystem = new ParticleSystem();
    let particlesActive = false;
    
    // Ensure the center-point is completely hidden
    const centerPoint = document.querySelector('.center-point');
    if (centerPoint) {
        centerPoint.style.display = 'none';
        centerPoint.style.background = 'transparent';
        centerPoint.style.width = '0';
        centerPoint.style.height = '0';
        centerPoint.style.opacity = '0';
        centerPoint.style.visibility = 'hidden';
    }

    // Set up audio-visual sync with peak detection for deathcore
    audioController.setOnBeatCallback((bassIntensity) => {
        // Only react to significant peaks (big kick drum hits)
        if (bassIntensity > 0) { // Only react when there's a peak above threshold
            // Nearly instantaneous reaction to peaks for particle speed
            const currentSpeed = particleSystem.baseSpeed;
            const targetSpeed = 0.15 + (bassIntensity / 255) * 0.7; // Keep the same target speed
            
            // Slower attack (80% of the way to target in one frame instead of 98%)
            particleSystem.baseSpeed = currentSpeed * 0.2 + targetSpeed * 0.8; // Reduced from 0.98 for slower attack
            
            // Add subtle camera shake only on the strongest peaks
            if (bassIntensity > 210) { // Keep the same threshold
                const shakeAmount = (bassIntensity - 210) / 255 * 0.07; // Keep the same shake amount
                particleSystem.camera.position.x = (Math.random() - 0.5) * shakeAmount;
                particleSystem.camera.position.y = (Math.random() - 0.5) * shakeAmount;
                
                // Reset camera position after a short delay
                setTimeout(() => {
                    particleSystem.camera.position.x = 0;
                    particleSystem.camera.position.y = 0;
                }, 50);
            }
        } else {
            // Slower return to default speed
            particleSystem.baseSpeed = particleSystem.baseSpeed * 0.9 + 0.15 * 0.1; // Changed from 0.8/0.2 for slower return
        }
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Get current audio data with peak detection
        let bassIntensity = 0;
        if (audioController.isPlaying && particlesActive) {
            // Get the bass frequency but don't amplify it further
            // The threshold is already applied in the AudioController
            bassIntensity = audioController.getBassFrequency();
        }
        
        // Update particle system
        particleSystem.update(bassIntensity);
    }

    // Start animation loop
    animate();

    const playButton = document.querySelector('.play-button');
    const clockContainer = document.querySelector('.clock-container');
    const clock = document.querySelector('.clock');
    let isPlaying = false;

    // Function to handle clock animation
    function showClockAnimation() {
        // Ensure center point is hidden before showing the clock
        const centerPoint = document.querySelector('.center-point');
        if (centerPoint) {
            centerPoint.style.display = 'none';
            centerPoint.style.background = 'transparent';
            centerPoint.style.width = '0';
            centerPoint.style.height = '0';
            centerPoint.style.opacity = '0';
            centerPoint.style.visibility = 'hidden';
        }
        
        clockContainer.style.display = 'block';
        clock.classList.add('animate');
        
        // Hide clock after animation
        setTimeout(() => {
            clockContainer.style.display = 'none';
            clock.classList.remove('animate');
        }, 10000);
    }

    playButton.addEventListener('click', async function() {
        try {
            if (!isPlaying) {
                // Show clock animation
                showClockAnimation();
                
                // Initialize audio context first
                await audioController.setupAudioContext();
                await audioController.togglePlay();
                isPlaying = true;
                playButton.classList.add('playing');
                particlesActive = true;
                
                // Add a class to the body for global music-active state
                document.body.classList.add('music-active');
            } else {
                await audioController.togglePlay();
                isPlaying = false;
                playButton.classList.remove('playing');
                particlesActive = false;
                
                // Remove music-active class
                document.body.classList.remove('music-active');
            }
        } catch (error) {
            console.error('Error handling playback:', error);
            isPlaying = false;
            playButton.classList.remove('playing');
            particlesActive = false;
            document.body.classList.remove('music-active');
        }
    });
}); 