# Underwriter - Ashes EP Landing Page

An immersive, interactive landing page for the Underwriter "Ashes" EP release. Features a dark, atmospheric design with dynamic particle effects that react to the music.

## Features

- Sleek, minimalist dark design
- Interactive play/pause controls
- Dynamic ash and ember particle effects
- Audio-reactive visuals that respond to the music's bass frequencies
- Atmospheric fog and lighting effects
- Fully responsive design
- Cross-browser compatible

## Setup

1. Replace the placeholder assets:
   - Update `[ALBUM_ART_URL]` in `index.html` with your album artwork URL
   - Update `[AUDIO_FILE_URL]` in `index.html` with your audio preview URL

2. Dependencies:
   - Three.js (v134) - for 3D particle effects
   - GSAP (v3.12.0) - for smooth animations

## Customization

### Particle Effects

You can customize the particle system in `scripts/particleSystem.js`:
- Adjust `particleCount` to change the number of particles
- Modify `baseSpeed` to change particle movement speed
- Update particle colors in the `createParticleTexture()` method

### Audio Reactivity

Tune the audio response in `scripts/audioController.js`:
- Adjust the bass threshold in the `update()` method
- Modify frequency ranges in `getBassFrequency()`

### Visual Style

Customize the appearance in `styles/main.css`:
- Update the color variables in `:root`
- Modify the fog and vignette effects
- Adjust animation timings

## Browser Support

Tested and working in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Notes

The site uses WebGL for particle effects. For optimal performance:
- Keep particle count under 1000
- Adjust particle size and complexity based on device capabilities
- Consider reducing effects on mobile devices

## License

All rights reserved. Contact Underwriter for usage permissions. 