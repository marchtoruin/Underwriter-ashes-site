document.addEventListener('DOMContentLoaded', () => {
    // Initialize systems
    const audioController = new AudioController();
    const particleSystem = new ParticleSystem();

    // Set up audio-visual sync
    audioController.setOnBeatCallback((bassIntensity) => {
        // Intensify particle effects on strong bass hits
        particleSystem.baseSpeed = 0.2 + (bassIntensity / 255) * 0.3;
    });

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);
        
        // Get current audio data
        const bassIntensity = audioController.isPlaying ? audioController.getBassFrequency() : 0;
        
        // Update particle system
        particleSystem.update(bassIntensity);
    }

    // Start animation loop
    animate();

    // Start audio analysis loop
    audioController.update();
}); 