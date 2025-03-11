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
        this.particleCount = 400; // Increased for more particles
        this.baseSpeed = 0.12; // Reduced from 0.15 for slower movement
        this.setup();
    }

    setup() {
        this.rendererBack.setSize(window.innerWidth, window.innerHeight);
        this.rendererFront.setSize(window.innerWidth, window.innerHeight);
        this.camera.position.z = 5;

        // Create particle materials with updated settings
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.085, // Increased from 0.065 for larger base particles
            map: this.createParticleTexture(),
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

            positions[i3] = Math.random() * 5 + 5;
            positions[i3 + 1] = (Math.random() - 0.5) * 10;
            positions[i3 + 2] = (Math.random() - 0.5) * 5;

            // Create more varied initial colors for spark-like effect
            const colorType = Math.random();
            if (colorType < 0.2) { // White-hot sparks (increased from 10% to 20%)
                colors[i3] = 1.0;     // Full red
                colors[i3 + 1] = 1.0; // Full green
                colors[i3 + 2] = 1.0; // Full blue = white
            } else if (colorType < 0.4) { // Bright blue-white sparks (new category)
                colors[i3] = 0.9;
                colors[i3 + 1] = 0.95;
                colors[i3 + 2] = 1.0; // Slightly blue tint
            } else if (colorType < 0.7) { // Bright yellow/orange sparks
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.7 + Math.random() * 0.3;
                colors[i3 + 2] = 0.2 + Math.random() * 0.3;
            } else { // Red/orange embers
                colors[i3] = 0.9 + Math.random() * 0.1;
                colors[i3 + 1] = 0.3 + Math.random() * 0.4;
                colors[i3 + 2] = 0.0;
            }

            // Add life cycle properties for spark-like behavior
            this.particles.push({
                velocity: new THREE.Vector3(
                    -(Math.random() * 0.03 + 0.01),
                    (Math.random() - 0.5) * 0.008,
                    (Math.random() - 0.5) * 0.008
                ),
                baseX: positions[i3],
                colorIntensity: 0.5 + Math.random() * 0.5,
                colorPhase: Math.random() * Math.PI * 2,
                isBackLayer: isBackLayer,
                flareUpChance: Math.random(), // Used for random intense flare-ups
                index: i,
                // New properties for spark life cycle
                age: 0,
                maxAge: 50 + Math.random() * 100, // Random lifespan
                isWhiteHot: colorType < 0.2, // Track if this is a white-hot particle
                initialColor: {
                    r: colors[i3],
                    g: colors[i3 + 1],
                    b: colors[i3 + 2]
                }
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

    createParticleTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64; // Increased from 32 for higher resolution texture
        canvas.height = 64; // Increased from 32 for higher resolution texture
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

    update(bassIntensity = 0) {
        const positionsBack = this.particleSystemBack.geometry.attributes.position.array;
        const positionsFront = this.particleSystemFront.geometry.attributes.position.array;
        const colorsBack = this.particleSystemBack.geometry.attributes.color.array;
        const colorsFront = this.particleSystemFront.geometry.attributes.color.array;
        
        // Make particles much more responsive to bass but with reduced speed
        const speedMultiplier = 1 + (bassIntensity / 255) * 4; // Reduced from 5 for slower movement
        const colorIntensityMultiplier = 1 + (bassIntensity / 255) * 4; // Keep the same color intensity
        
        // Add pulsing effect based on bass intensity (more dramatic on big hits)
        const pulseScale = 1 + (bassIntensity / 255) * 0.4; // Increased from 0.3 for more dramatic effect on big hits
        this.particleSystemBack.scale.set(pulseScale, pulseScale, pulseScale);
        this.particleSystemFront.scale.set(pulseScale, pulseScale, pulseScale);

        for (let i = 0; i < this.particleCount; i++) {
            const particle = this.particles[i];
            const i3 = i * 3;
            const positions = particle.isBackLayer ? positionsBack : positionsFront;
            const colors = particle.isBackLayer ? colorsBack : colorsFront;

            // Update positions with more controlled movement
            positions[i3] += particle.velocity.x * this.baseSpeed * speedMultiplier;
            positions[i3 + 1] += particle.velocity.y * this.baseSpeed * speedMultiplier * 1.2;
            positions[i3 + 2] += particle.velocity.z * this.baseSpeed * speedMultiplier * 1.2;
            
            // Increase vertical velocity slightly to simulate rising sparks
            particle.velocity.y += 0.0001;
            
            // Age the particle
            particle.age++;
            
            // Calculate life percentage (0 = new, 1 = about to die)
            const lifePercentage = Math.min(1, particle.age / particle.maxAge);
            
            // Update colors based on particle age and type
            if (particle.isWhiteHot) {
                // White-hot particles: start white, then fade to yellow, orange, red, and finally dark red
                if (lifePercentage < 0.2) {
                    // White-hot phase - extra bright with pure white (values can exceed 1.0 with HDR rendering)
                    colors[i3] = 1.5; // Increased brightness for red
                    colors[i3 + 1] = 1.5; // Increased brightness for green
                    colors[i3 + 2] = 1.5; // Increased brightness for blue
                } else if (lifePercentage < 0.4) {
                    // Yellow phase - still very bright
                    colors[i3] = 1.3; // Increased brightness for red
                    colors[i3 + 1] = 1.3 - (lifePercentage - 0.2) * 1.5;
                    colors[i3 + 2] = 1.1 - (lifePercentage - 0.2) * 5.0;
                } else if (lifePercentage < 0.7) {
                    // Orange phase
                    colors[i3] = 1.1; // Slightly increased brightness
                    colors[i3 + 1] = 0.7 - (lifePercentage - 0.4) * 1.0;
                    colors[i3 + 2] = 0.0;
                } else {
                    // Red to dark red phase
                    colors[i3] = 1.0 - (lifePercentage - 0.7) * 2.0;
                    colors[i3 + 1] = 0.3 - (lifePercentage - 0.7) * 1.0;
                    colors[i3 + 2] = 0.0;
                }
                
                // Add flickering to white-hot particles - less flickering for more consistent brightness
                const flicker = 0.97 + Math.random() * 0.06; // Reduced flickering for more consistent brightness
                colors[i3] *= flicker;
                colors[i3 + 1] *= flicker;
                colors[i3 + 2] *= flicker;
            } else {
                // Regular particles: update with existing logic but add age-based dimming
                particle.colorPhase += 0.02 + (bassIntensity / 255) * 0.06;
                let flickerIntensity = (0.5 + Math.sin(particle.colorPhase) * 0.5 * particle.colorIntensity) * colorIntensityMultiplier;
                
                // Random intense flare-ups with higher chance during bass hits
                const flareUpChance = bassIntensity > 100 ? 0.97 : 0.995;
                if (particle.flareUpChance > 0.8 && Math.random() > flareUpChance) {
                    // Super bright flash - temporarily turn into white-hot
                    colors[i3] = 1.0;
                    colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                    colors[i3 + 2] = 0.8 + Math.random() * 0.2;
                    flickerIntensity = 2.0;
                } else {
                    // Normal color updates with more dramatic range
                    const colorPhase = (Math.sin(particle.colorPhase) + 1) / 2;
                    
                    if (colorPhase < 0.3) { // Dark red state
                        colors[i3] = 0.4 + (flickerIntensity * 0.3);
                        colors[i3 + 1] = 0.0;
                        colors[i3 + 2] = 0.0;
                    } else if (colorPhase < 0.7) { // Orange/bright red state
                        colors[i3] = 0.9 + (flickerIntensity * 0.1);
                        colors[i3 + 1] = 0.4 + (flickerIntensity * 0.4);
                        colors[i3 + 2] = 0.0;
                    } else { // Bright yellow/white state with more red
                        colors[i3] = 1.0;
                        colors[i3 + 1] = 0.6 + (flickerIntensity * 0.4);
                        colors[i3 + 2] = 0.2 + (flickerIntensity * 0.5);
                    }
                    
                    // Dim colors as particle ages
                    const ageDimming = 1.0 - (lifePercentage * 0.7);
                    colors[i3] *= ageDimming;
                    colors[i3 + 1] *= ageDimming;
                    colors[i3 + 2] *= ageDimming;
                }
            }

            // Add bass-reactive size changes
            if (bassIntensity > 130) {
                // Increase size on strong bass hits
                const sizeMultiplier = 0.085 + (bassIntensity / 255) * 0.1; // Increased from 0.065 + 0.08
                if (particle.isBackLayer) {
                    this.particleSystemBack.material.size = sizeMultiplier;
                } else {
                    this.particleSystemFront.material.size = sizeMultiplier;
                }
            } else {
                // Vary size based on particle age - larger base size, smaller reduction as they age
                const baseSize = 0.085; // Increased from 0.065
                const ageSize = baseSize * (1.0 - (lifePercentage * 0.4)); // Reduced age effect from 0.5 to 0.4
                
                // Make white-hot particles larger
                const whiteHotBonus = particle.isWhiteHot ? 0.02 : 0;
                
                if (particle.isBackLayer) {
                    this.particleSystemBack.material.size = ageSize + whiteHotBonus;
                } else {
                    this.particleSystemFront.material.size = ageSize + whiteHotBonus;
                }
            }

            // Reset particles that go too far left or reach max age
            if (positions[i3] < -5 || particle.age > particle.maxAge) {
                // Reset position
                positions[i3] = Math.random() * 2 + 5;
                positions[i3 + 1] = (Math.random() - 0.5) * 10;
                positions[i3 + 2] = (Math.random() - 0.5) * 5;
                
                // Reset velocity
                particle.velocity.x = -(Math.random() * 0.03 + 0.01);
                particle.velocity.y = (Math.random() - 0.5) * 0.008;
                particle.velocity.z = (Math.random() - 0.5) * 0.008;
                
                // Reset age and potentially change particle type
                particle.age = 0;
                particle.maxAge = 50 + Math.random() * 100;
                
                // 25% chance to become white-hot on respawn
                particle.isWhiteHot = Math.random() < 0.25;
                
                // Reset colors based on new type
                if (particle.isWhiteHot) {
                    colors[i3] = 1.5; // Increased brightness
                    colors[i3 + 1] = 1.5; // Increased brightness
                    colors[i3 + 2] = 1.5; // Increased brightness
                } else {
                    // Random color from orange to red
                    colors[i3] = 0.9 + Math.random() * 0.2; // Brighter red
                    colors[i3 + 1] = 0.3 + Math.random() * 0.4;
                    colors[i3 + 2] = 0.0;
                }
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