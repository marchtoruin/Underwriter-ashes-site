class ParticleSystem {
    constructor() {
        // Create two scenes for layered effect
        this.sceneBack = new THREE.Scene();
        this.sceneFront = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        // Create two renderers with proper transparency settings
        this.rendererBack = new THREE.WebGLRenderer({
            canvas: document.getElementById('particleCanvas-back'),
            alpha: true,
            premultipliedAlpha: false,
            antialias: true
        });
        this.rendererFront = new THREE.WebGLRenderer({
            canvas: document.getElementById('particleCanvas-front'),
            alpha: true,
            premultipliedAlpha: false,
            antialias: true
        });
        
        this.rendererBack.setClearColor(0x000000, 0);
        this.rendererFront.setClearColor(0x000000, 0);
        
        this.particles = [];
        this.particleCount = 3500; // Increased from 2000 for more particles
        this.baseSpeed = 0.04; // Keeping the same base speed
        
        // Track time for continuous particle spawning
        this.lastSpawnTime = 0;
        this.spawnRate = 0.35; // Increased from 0.25 for more frequent spawning
        
        // Frame counter for subtle wind effects
        this.frameCount = 0;
        
        // Wind effect parameters - enhanced for more pronounced wind effect
        this.windStrength = 0.003; // Increased from 0.001 for stronger wind
        this.windDirection = -1; // Wind blows from right to left
        this.windVariability = 0.002; // New parameter for wind gusts and changes
        this.windChangeSpeed = 0.0005; // How quickly the wind changes
        this.turbulenceFactor = 0.001; // New parameter for random turbulence
        
        this.setup();
    }

    setup() {
        this.rendererBack.setSize(window.innerWidth, window.innerHeight);
        this.rendererFront.setSize(window.innerWidth, window.innerHeight);
        this.camera.position.z = 5;

        // Create particle materials with updated settings
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.18, // Significantly increased from 0.1 for more visible particles
            map: this.createSparkTexture(), // Use spark texture
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
            vertexColors: true
        });

        // Create particles for both layers
        const particleGeometryBack = new THREE.BufferGeometry();
        const particleGeometryFront = new THREE.BufferGeometry();
        const positionsBack = new Float32Array(this.particleCount * 3);
        const positionsFront = new Float32Array(this.particleCount * 3);
        const colorsBack = new Float32Array(this.particleCount * 3);
        const colorsFront = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            const isBackLayer = Math.random() > 0.4; // 60% back, 40% front
            const positions = isBackLayer ? positionsBack : positionsFront;
            const colors = isBackLayer ? colorsBack : colorsFront;

            // Distribute particles across the entire width of the screen
            // Some start off-screen to the right, some in the middle, some to the left
            positions[i3] = Math.random() * 30 - 15; // Range from -15 to +15
            positions[i3 + 1] = (Math.random() - 0.5) * 10; // Vertical position
            positions[i3 + 2] = (Math.random() - 0.5) * 5; // Depth

            // Create more varied initial colors for spark-like effect with increased brightness
            const colorType = Math.random();
            if (colorType < 0.3) { // White-hot sparks (increased from 25% to 30%)
                colors[i3] = 2.0;     // Much brighter red
                colors[i3 + 1] = 2.0; // Much brighter green
                colors[i3 + 2] = 2.0; // Much brighter blue = white
            } else if (colorType < 0.5) { // Bright blue-white sparks (increased from 20% to 25%)
                colors[i3] = 1.5;     // Brighter
                colors[i3 + 1] = 1.5; // Brighter
                colors[i3 + 2] = 1.8; // Brighter blue tint
            } else if (colorType < 0.8) { // Bright yellow/orange sparks
                colors[i3] = 1.8;     // Much brighter
                colors[i3 + 1] = 1.0 + Math.random() * 0.5; // Brighter
                colors[i3 + 2] = 0.3 + Math.random() * 0.4; // Brighter
            } else { // Red/orange embers
                colors[i3] = 1.5 + Math.random() * 0.3; // Much brighter red
                colors[i3 + 1] = 0.5 + Math.random() * 0.5; // Brighter orange
                colors[i3 + 2] = 0.1 + Math.random() * 0.2; // Slight blue for more visibility
            }

            // Add life cycle properties for spark-like behavior
            this.particles.push({
                velocity: new THREE.Vector3(
                    -(Math.random() * 0.03 + 0.01), // Base horizontal velocity (always negative)
                    (Math.random() - 0.5) * 0.006, // Increased from 0.003 for more vertical movement
                    0  // No depth velocity
                ),
                // Wind drift properties
                driftFactor: Math.random() * 0.8 + 0.4, // Increased range from 0.5-1.0 to 0.4-1.2 for more varied wind response
                driftPhase: Math.random() * Math.PI * 2, // Random phase for subtle drift
                turbulencePhase: Math.random() * Math.PI * 2, // New random phase for turbulence
                turbulenceFrequency: 0.01 + Math.random() * 0.02, // Random frequency for turbulence
                
                // Occasional "pop" behavior with reduced frequency
                popChance: Math.random(), 
                hasPoppedYet: false,
                popThreshold: 0.997, // Slightly lower threshold for slightly more frequent pops
                
                baseX: positions[i3],
                colorIntensity: 0.7 + Math.random() * 0.5, // Increased from 0.5 for brighter colors
                colorPhase: Math.random() * Math.PI * 2,
                isBackLayer: isBackLayer,
                index: i,
                // Life cycle properties
                age: 0,
                maxAge: 2500 + Math.random() * 1500, // Significantly increased from 1500+1000 for longer lifespan
                isWhiteHot: colorType < 0.3, // Track if this is a white-hot particle
                initialColor: {
                    r: colors[i3],
                    g: colors[i3 + 1],
                    b: colors[i3 + 2]
                },
                active: true,
                size: 0.15 + Math.random() * 0.08, // Significantly increased from 0.08+0.04 for larger particles
                rotation: Math.random() * Math.PI * 2, // Random rotation for spark texture
                hasSwirl: Math.random() > 0.7, // 30% of particles have swirl
                swirlFrequency: 0.005 + Math.random() * 0.01,
                swirlAmplitude: 0.0005 + Math.random() * 0.001,
                swirlPhase: Math.random() * Math.PI * 2
            });
        }

        particleGeometryBack.setAttribute('position', new THREE.BufferAttribute(positionsBack, 3));
        particleGeometryBack.setAttribute('color', new THREE.BufferAttribute(colorsBack, 3));
        particleGeometryFront.setAttribute('position', new THREE.BufferAttribute(positionsFront, 3));
        particleGeometryFront.setAttribute('color', new THREE.BufferAttribute(colorsFront, 3));

        this.particleSystemBack = new THREE.Points(particleGeometryBack, particleMaterial.clone());
        this.particleSystemFront = new THREE.Points(particleGeometryFront, particleMaterial.clone());
        
        this.sceneBack.add(this.particleSystemBack);
        this.sceneFront.add(this.particleSystemFront);

        window.addEventListener('resize', () => this.handleResize());
    }

    // Create a spark-shaped texture instead of a circular one
    createSparkTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128; // Increased from 64 for higher resolution
        canvas.height = 128; // Increased from 64 for higher resolution
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, 128, 128);
        
        // Create an elongated spark shape
        const centerX = 64;
        const centerY = 64;
        
        // Draw the main spark body - elongated with tapered ends
        ctx.beginPath();
        
        // Create a gradient for the spark with more intense colors
        const gradient = ctx.createLinearGradient(24, 64, 104, 64);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)'); // Transparent at the tail
        gradient.addColorStop(0.2, 'rgba(255, 200, 80, 0.8)'); // Brighter orange-yellow
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)'); // Bright white in the center
        gradient.addColorStop(0.8, 'rgba(255, 200, 80, 0.8)'); // Brighter orange-yellow
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Transparent at the head
        
        ctx.fillStyle = gradient;
        
        // Draw a wider, more visible elongated shape
        ctx.moveTo(24, centerY);
        ctx.quadraticCurveTo(centerX, centerY - 8, 104, centerY); // Wider curve
        ctx.quadraticCurveTo(centerX, centerY + 8, 24, centerY); // Wider curve
        ctx.fill();
        
        // Add a brighter, larger center
        const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 16);
        centerGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        centerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Add more small random dots for additional spark effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Brighter dots
        for (let i = 0; i < 8; i++) { // More dots
            const x = 32 + Math.random() * 64;
            const y = 56 + Math.random() * 16;
            const size = 1.5 + Math.random() * 3; // Larger dots
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    // Keep the original particle texture for reference
    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Create a more intense, spark-like gradient with a more prominent white center
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(255,255,255,1)'); // Pure white center
        gradient.addColorStop(0.1, 'rgba(255,255,255,1)'); // Extend the pure white core
        gradient.addColorStop(0.15, 'rgba(255,255,255,0.98)'); // Very slight fade at edge of core
        gradient.addColorStop(0.25, 'rgba(255,240,220,0.95)'); // Slightly off-white with higher opacity
        gradient.addColorStop(0.35, 'rgba(255,220,180,0.9)'); // Warm white with higher opacity
        gradient.addColorStop(0.5, 'rgba(255,120,20,0.8)'); // Orange with higher opacity
        gradient.addColorStop(0.7, 'rgba(255,40,0,0.6)'); // Deep orange/red with higher opacity
        gradient.addColorStop(1, 'rgba(0,0,0,0)'); // Transparent edge

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);

        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.rendererBack.setSize(width, height);
        this.rendererFront.setSize(width, height);
    }

    // Create a new particle at the right edge of the screen
    spawnParticle() {
        // Find an inactive particle to reuse
        for (let i = 0; i < this.particleCount; i++) {
            const particle = this.particles[i];
            if (!particle.active) {
                const i3 = particle.index * 3;
                const positions = particle.isBackLayer ? 
                    this.particleSystemBack.geometry.attributes.position.array : 
                    this.particleSystemFront.geometry.attributes.position.array;
                const colors = particle.isBackLayer ? 
                    this.particleSystemBack.geometry.attributes.color.array : 
                    this.particleSystemFront.geometry.attributes.color.array;
                
                // Position at right edge of screen with more variation
                positions[i3] = 15 + Math.random() * 5; // Increased from 2 to 5 for more spread
                positions[i3 + 1] = (Math.random() - 0.5) * 12; // Increased from 10 to 12 for more vertical spread
                positions[i3 + 2] = (Math.random() - 0.5) * 5; // Random depth
                
                // Reset velocity for wind-like movement with more variation
                // More varied horizontal velocity - some particles move faster, some slower
                particle.velocity.x = -(Math.random() * 0.04 + 0.008); // Wider range from 0.008 to 0.048
                
                // More varied vertical velocity - some particles have stronger initial upward/downward movement
                particle.velocity.y = (Math.random() - 0.5) * 0.01; // Increased from 0.006 for more initial vertical movement
                particle.velocity.z = 0; // No depth velocity
                
                // Reset wind drift properties with more variation
                particle.driftFactor = Math.random() * 1.0 + 0.3; // Increased range from 0.4-1.2 to 0.3-1.3
                particle.driftPhase = Math.random() * Math.PI * 2;
                particle.turbulencePhase = Math.random() * Math.PI * 2;
                particle.turbulenceFrequency = 0.008 + Math.random() * 0.025; // Wider range for more varied turbulence
                
                // Add occasional "swirl" behavior
                particle.hasSwirl = Math.random() > 0.7; // 30% of particles have swirl
                particle.swirlFrequency = 0.005 + Math.random() * 0.01;
                particle.swirlAmplitude = 0.0005 + Math.random() * 0.001;
                particle.swirlPhase = Math.random() * Math.PI * 2;
                
                // Reset pop behavior
                particle.popChance = Math.random();
                particle.hasPoppedYet = false;
                
                // Reset age and color with more variation
                particle.age = 0;
                particle.maxAge = 2000 + Math.random() * 2000; // More varied lifespan from 2000-4000
                
                // Determine if white-hot
                particle.isWhiteHot = Math.random() < 0.35; // Increased chance for white-hot particles from 0.3 to 0.35
                
                // Reset rotation
                particle.rotation = Math.random() * Math.PI * 2;
                
                // Reset colors based on type with more intensity
                if (particle.isWhiteHot) {
                    colors[i3] = 2.0; // Much brighter
                    colors[i3 + 1] = 2.0; // Much brighter
                    colors[i3 + 2] = 2.0; // Much brighter
                } else {
                    // Random color from orange to red with more intensity
                    const colorType = Math.random();
                    if (colorType < 0.3) { // Blue-white
                        colors[i3] = 1.5;
                        colors[i3 + 1] = 1.5;
                        colors[i3 + 2] = 1.8; // Brighter blue tint
                    } else if (colorType < 0.7) { // Yellow/orange
                        colors[i3] = 1.8;
                        colors[i3 + 1] = 1.0 + Math.random() * 0.5;
                        colors[i3 + 2] = 0.3 + Math.random() * 0.4;
                    } else { // Red/orange
                        colors[i3] = 1.5 + Math.random() * 0.3;
                        colors[i3 + 1] = 0.5 + Math.random() * 0.5;
                        colors[i3 + 2] = 0.1 + Math.random() * 0.2;
                    }
                }
                
                // Random size variation - larger particles
                particle.size = 0.15 + Math.random() * 0.08;
                
                // Mark as active
                particle.active = true;
                
                // We've reused a particle, so we're done
                return;
            }
        }
    }

    update(bassIntensity = 0) {
        // Increment frame counter for wind effects
        this.frameCount++;
        
        const positionsBack = this.particleSystemBack.geometry.attributes.position.array;
        const positionsFront = this.particleSystemFront.geometry.attributes.position.array;
        const colorsBack = this.particleSystemBack.geometry.attributes.color.array;
        const colorsFront = this.particleSystemFront.geometry.attributes.color.array;
        
        // Constant speed (no music reactivity)
        const speedMultiplier = 1.0;
        
        // Constant scale (no music reactivity)
        const pulseScale = 1.0;
        this.particleSystemBack.scale.set(pulseScale, pulseScale, pulseScale);
        this.particleSystemFront.scale.set(pulseScale, pulseScale, pulseScale);

        // Spawn new particles at a constant rate
        this.lastSpawnTime += this.spawnRate;
        while (this.lastSpawnTime >= 1) {
            this.spawnParticle();
            this.lastSpawnTime -= 1;
        }

        // Create a more dynamic wind effect that varies over time
        // Base wind with slow variation
        const baseWindY = Math.sin(this.frameCount * this.windChangeSpeed) * this.windStrength;
        
        // Add wind gusts - occasional stronger bursts
        const gustFactor = Math.sin(this.frameCount * 0.0003) * Math.sin(this.frameCount * 0.0007);
        const windGust = (gustFactor > 0.7) ? gustFactor * this.windVariability : 0;
        
        // Combined wind effect
        const globalWindY = baseWindY + windGust;
        
        for (let i = 0; i < this.particleCount; i++) {
            const particle = this.particles[i];
            if (!particle.active) continue; // Skip inactive particles
            
            const i3 = i * 3;
            const positions = particle.isBackLayer ? positionsBack : positionsFront;
            const colors = particle.isBackLayer ? colorsBack : colorsFront;

            // Calculate individual particle drift based on global wind
            const particleWindY = globalWindY * particle.driftFactor;
            
            // Add a more pronounced sine wave to vertical movement for natural drift
            const driftY = Math.sin(this.frameCount * 0.01 + particle.driftPhase) * 0.001 * particle.driftFactor;
            
            // Add random turbulence for more chaotic movement
            const turbulenceX = Math.sin(this.frameCount * particle.turbulenceFrequency + particle.turbulencePhase) * this.turbulenceFactor;
            const turbulenceY = Math.cos(this.frameCount * particle.turbulenceFrequency + particle.turbulencePhase) * this.turbulenceFactor;
            
            // Add swirl movement for particles with swirl behavior
            let swirlX = 0;
            let swirlY = 0;
            if (particle.hasSwirl) {
                const swirlFactor = Math.sin(this.frameCount * particle.swirlFrequency + particle.swirlPhase);
                swirlX = Math.cos(this.frameCount * particle.swirlFrequency + particle.swirlPhase) * particle.swirlAmplitude;
                swirlY = swirlFactor * particle.swirlAmplitude;
            }
            
            // Update positions with primary horizontal movement and enhanced vertical drift
            positions[i3] += (particle.velocity.x + turbulenceX + swirlX) * this.baseSpeed * speedMultiplier;
            positions[i3 + 1] += (particle.velocity.y + particleWindY + driftY + turbulenceY + swirlY) * this.baseSpeed * speedMultiplier;
            
            // Occasionally make particles "pop" with a subtle change in direction
            if (!particle.hasPoppedYet && Math.random() > particle.popThreshold && particle.popChance > 0.85) {
                // More pronounced change in velocity - both horizontal and vertical
                particle.velocity.x += (Math.random() - 0.3) * 0.005; // Slight bias toward slowing down
                particle.velocity.y += (Math.random() - 0.5) * 0.015; // Increased from 0.01 for more dramatic pops
                
                // Brighten the particle temporarily
                colors[i3] *= 1.5;
                colors[i3 + 1] *= 1.5;
                colors[i3 + 2] *= 1.5;
                
                // Mark as popped so it doesn't pop again
                particle.hasPoppedYet = true;
            }
            
            // Age the particle
            particle.age++;
            
            // Calculate life percentage (0 = new, 1 = about to die)
            const lifePercentage = Math.min(1, particle.age / particle.maxAge);
            
            // Update colors based on particle age and type
            if (particle.isWhiteHot) {
                // White-hot particles: start white, then fade to yellow, orange, red, and finally dark red
                if (lifePercentage < 0.2) {
                    // White-hot phase - extra bright with pure white
                    colors[i3] = 2.0; // Increased from 1.5 for more brightness
                    colors[i3 + 1] = 2.0; // Increased from 1.5 for more brightness
                    colors[i3 + 2] = 2.0; // Increased from 1.5 for more brightness
                } else if (lifePercentage < 0.4) {
                    // Yellow phase - still very bright
                    colors[i3] = 1.8; // Increased from 1.3 for more brightness
                    colors[i3 + 1] = 1.8 - (lifePercentage - 0.2) * 1.5; // Increased from 1.3 for more brightness
                    colors[i3 + 2] = 1.5 - (lifePercentage - 0.2) * 5.0; // Increased from 1.1 for more brightness
                } else if (lifePercentage < 0.7) {
                    // Orange phase
                    colors[i3] = 1.5; // Increased from 1.1 for more brightness
                    colors[i3 + 1] = 1.0 - (lifePercentage - 0.4) * 1.0; // Increased from 0.7 for more brightness
                    colors[i3 + 2] = 0.2; // Added slight blue for more visibility
                } else {
                    // Red to dark red phase - still fairly bright
                    colors[i3] = 1.3 - (lifePercentage - 0.7) * 1.5; // Increased from 1.0 for more brightness
                    colors[i3 + 1] = 0.5 - (lifePercentage - 0.7) * 0.8; // Increased from 0.3 for more brightness
                    colors[i3 + 2] = 0.1; // Added slight blue for more visibility
                }
                
                // Add subtle flickering to white-hot particles
                const flicker = 0.95 + Math.random() * 0.1; // More pronounced flickering
                colors[i3] *= flicker;
                colors[i3 + 1] *= flicker;
                colors[i3 + 2] *= flicker;
            } else {
                // Regular particles: simpler color updates without music reactivity
                particle.colorPhase += 0.01; // Slower rate of color change
                
                // Normal color updates with more dramatic range
                const colorPhase = (Math.sin(particle.colorPhase) + 1) / 2;
                
                if (colorPhase < 0.3) { // Dark red state - brighter
                    colors[i3] = 0.7 + (particle.colorIntensity * 0.3); // Increased from 0.4 for more brightness
                    colors[i3 + 1] = 0.2; // Added some green for more visibility
                    colors[i3 + 2] = 0.1; // Added some blue for more visibility
                } else if (colorPhase < 0.7) { // Orange/bright red state - brighter
                    colors[i3] = 1.3 + (particle.colorIntensity * 0.1); // Increased from 0.9 for more brightness
                    colors[i3 + 1] = 0.6 + (particle.colorIntensity * 0.4); // Increased from 0.4 for more brightness
                    colors[i3 + 2] = 0.1; // Added slight blue for more visibility
                } else { // Bright yellow/white state with more red - brighter
                    colors[i3] = 1.5; // Increased from 1.0 for more brightness
                    colors[i3 + 1] = 0.8 + (particle.colorIntensity * 0.4); // Increased from 0.6 for more brightness
                    colors[i3 + 2] = 0.3 + (particle.colorIntensity * 0.5); // Increased from 0.2 for more brightness
                }
                
                // Occasional subtle flickering for ember effect (less frequent)
                if (Math.random() > 0.98) {
                    const flickerAmount = 0.9 + Math.random() * 0.3; // More pronounced flickering
                    colors[i3] *= flickerAmount;
                    colors[i3 + 1] *= flickerAmount;
                    colors[i3 + 2] *= flickerAmount;
                }
                
                // Dim colors as particle ages - extremely slow dimming for longer visual persistence
                const ageDimming = 1.0 - (lifePercentage * 0.15); // Reduced from 0.2 for slower dimming
                colors[i3] *= ageDimming;
                colors[i3 + 1] *= ageDimming;
                colors[i3 + 2] *= ageDimming;
            }

            // Set size for particles with individual variation
            const ageSize = particle.size * (1.0 - (lifePercentage * 0.15)); // Reduced from 0.2 for slower size reduction
            
            // Make white-hot particles larger
            const whiteHotBonus = particle.isWhiteHot ? 0.04 : 0; // Increased from 0.02 for more visible white-hot particles
            
            if (particle.isBackLayer) {
                this.particleSystemBack.material.size = ageSize + whiteHotBonus;
            } else {
                this.particleSystemFront.material.size = ageSize + whiteHotBonus;
            }

            // Mark particles as inactive when they go off-screen to the left
            if (positions[i3] < -15) {
                particle.active = false;
            }
        }

        this.particleSystemBack.geometry.attributes.position.needsUpdate = true;
        this.particleSystemBack.geometry.attributes.color.needsUpdate = true;
        this.particleSystemFront.geometry.attributes.position.needsUpdate = true;
        this.particleSystemFront.geometry.attributes.color.needsUpdate = true;

        this.rendererBack.render(this.sceneBack, this.camera);
        this.rendererFront.render(this.sceneFront, this.camera);
    }
}

// Export the particle system
window.ParticleSystem = ParticleSystem; 