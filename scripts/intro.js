document.addEventListener('DOMContentLoaded', () => {
    // Get references to elements
    const introOverlay = document.querySelector('.intro-overlay');
    const introLogoContainer = document.querySelector('.intro-logo-container');
    const introLogo = document.querySelector('.intro-logo');
    const mainContainer = document.querySelector('.container');
    
    // Add TV power-on animation
    // Initially hide the logo
    introLogo.style.opacity = '0';
    introLogoContainer.style.boxShadow = 'none';
    
    // TV power-on effect with a slight delay
    setTimeout(() => {
        // Add a white flash
        introLogoContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        
        // Return to normal after a brief flash
        setTimeout(() => {
            introLogoContainer.style.backgroundColor = 'rgba(20, 20, 20, 0.3)';
            introLogo.style.opacity = '0.15'; // Show the logo
            
            // Add the box shadow (TV glow) after the flash
            introLogoContainer.style.boxShadow = `
                0 0 10px rgba(255, 255, 255, 0.05),
                0 0 20px rgba(255, 0, 0, 0.03),
                0 0 30px rgba(0, 0, 255, 0.03)
            `;
        }, 150);
    }, 500);
    
    // Function to end the intro and show the main content
    function endIntro() {
        // Add fade-out class to intro overlay
        introOverlay.classList.add('fade-out');
        
        // Show the main container
        mainContainer.classList.add('show');
        
        // Remove the intro overlay from the DOM after animation completes
        setTimeout(() => {
            introOverlay.remove();
        }, 2000); // Match the transition duration in CSS
    }
    
    // Set timeout for the intro duration (logo flicker animation + extra time)
    // Total intro time: 5 seconds (4s for animation + 1s extra)
    setTimeout(endIntro, 5000);
    
    // Allow skipping the intro by clicking anywhere
    introOverlay.addEventListener('click', () => {
        endIntro();
    });
}); 