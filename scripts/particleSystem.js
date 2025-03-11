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
        this.baseSpeed = 0.25;
        this.setup();
    }

    setup() {
        this.rendererBack.setSize(window.innerWidth, window.innerHeight);
        this.rendererFront.setSize(window.innerWidth, window.innerHeight);
        this.camera.position.z = 5;

        // Create particle materials with updated settings
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.08,
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

            const colorType = Math.random();
            if (colorType < 0.3) { // Dark red embers
                colors[i3] = 0.4 + Math.random() * 0.2;
                colors[i3 + 1] = 0.0;
                colors[i3 + 2] = 0.0;
            } else if (colorType < 0.7) { // Bright orange embers
                colors[i3] = 0.8 + Math.random() * 0.2;
                colors[i3 + 1] = 0.3 + Math.random() * 0.2;
                colors[i3 + 2] = 0.0;
            } else if (colorType < 0.9) { // Bright yellow embers
                colors[i3] = 0.9 + Math.random() * 0.1;
                colors[i3 + 1] = 0.7 + Math.random() * 0.3;
                colors[i3 + 2] = 0.0;
            } else { // Super bright flare-ups (10% chance)
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i3 + 2] = 0.7 + Math.random() * 0.3;
            }

            this.particles.push({
                velocity: new THREE.Vector3(
                    -(Math.random() * 0.06 + 0.02),
                    (Math.random() - 0.5) * 0.01,
                    (Math.random() - 0.5) * 0.01
                ),
                baseX: positions[i3],
                colorIntensity: 0.5 + Math.random() * 0.5,
                colorPhase: Math.random() * Math.PI * 2,
                isBackLayer: isBackLayer,
                flareUpChance: Math.random(), // Used for random intense flare-ups
                index: i
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
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');

        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(255,220,180,0.95)');
        gradient.addColorStop(0.4, 'rgba(255,80,0,0.8)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);

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
        const speedMultiplier = 1 + (bassIntensity / 255) * 3;

        for (let i = 0; i < this.particleCount; i++) {
            const particle = this.particles[i];
            const i3 = i * 3;
            const positions = particle.isBackLayer ? positionsBack : positionsFront;
            const colors = particle.isBackLayer ? colorsBack : colorsFront;

            // Update positions
            positions[i3] += particle.velocity.x * this.baseSpeed * speedMultiplier;
            positions[i3 + 1] += particle.velocity.y * this.baseSpeed * speedMultiplier;
            positions[i3 + 2] += particle.velocity.z * this.baseSpeed * speedMultiplier;

            // Update colors with potential flare-ups
            particle.colorPhase += 0.02;
            let flickerIntensity = 0.7 + Math.sin(particle.colorPhase) * 0.3 * particle.colorIntensity;

            // Random intense flare-ups
            if (particle.flareUpChance > 0.9 && Math.random() > 0.995) {
                flickerIntensity = 2.0; // Super bright flash
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i3 + 2] = 0.7 + Math.random() * 0.3;
            } else {
                // Normal color updates
                if (colors[i3] > 0.9) { // Bright yellow/white particles
                    colors[i3] = 0.9 + (flickerIntensity * 0.1);
                    colors[i3 + 1] = 0.7 + (flickerIntensity * 0.3);
                    colors[i3 + 2] = Math.max(0, (flickerIntensity - 1) * 0.5); // Allow some white
                } else if (colors[i3] > 0.6) { // Orange particles
                    colors[i3] = 0.8 + (flickerIntensity * 0.2);
                    colors[i3 + 1] = 0.3 + (flickerIntensity * 0.2);
                    colors[i3 + 2] = 0;
                } else { // Dark red particles
                    colors[i3] = 0.4 + (flickerIntensity * 0.2);
                    colors[i3 + 1] = 0.0 + (flickerIntensity * 0.1);
                    colors[i3 + 2] = 0;
                }
            }

            // Reset particles that go too far left
            if (positions[i3] < -5) {
                positions[i3] = Math.random() * 2 + 5;
                positions[i3 + 1] = (Math.random() - 0.5) * 10;
                positions[i3 + 2] = (Math.random() - 0.5) * 5;
                
                particle.velocity.x = -(Math.random() * 0.06 + 0.02);
                particle.velocity.y = (Math.random() - 0.5) * 0.01;
                particle.velocity.z = (Math.random() - 0.5) * 0.01;
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