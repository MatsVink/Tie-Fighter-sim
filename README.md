# Imperial Ace: TIE Fighter Sim

## Overview
Imperial Ace is an immersive, high-performance web-based TIE Fighter simulation. Take control of the Empire's most iconic starfighter and defend the sector against Rebel incursions in an unlimited procedural space environment.

## Key Features
- **Dynamic 3D Simulation**: Built with React Three Fiber and Three.js for smooth, cinematic space combat.
- **AI-Powered Radio Chatter**: Utilizes the **Google Gemini API** (`gemini-3-flash-preview`) to generate procedural, context-aware Imperial Command messages in real-time based on in-game events.
- **Advanced Flight Model**: Features precision mouse steering with a "flight stick" feel, dynamic banking, and responsive throttle controls.
- **Procedural Enemy AI**: Aggressive X-Wings that hunt the player, performing tactical maneuvers and engaging in intense dogfights.
- **Authentic Imperial HUD**: A detailed tactical interface featuring a functional local-coordinate radar, hull integrity monitors, and laser capacitor tracking.
- **Visual Effects**: Cinematic explosions and twin-laser projectile systems.

## Controls
- **Mouse**: Precision Steering (Pitch & Yaw). The ship naturally banks during turns.
- **W / S**: Throttle (Increase/Decrease speed).
- **A / D**: Lateral Strafe (Dampened for stability).
- **Left Click**: Fire Twin Laser Cannons.
- **Pointer Lock**: Click the launch button or the screen to lock your cursor for flight control. ESC to unlock.

## Technical Stack
- **Framework**: React 19
- **Graphics**: Three.js, @react-three/fiber, @react-three/drei
- **Intelligence**: @google/genai (Gemini 3 Flash Preview)
- **Styling**: Tailwind CSS
- **Fonts**: Orbitron & Share Tech Mono (via Google Fonts)

## Setup
The application requires the `@google/genai` SDK and a valid Google AI API Key provided via environment variables to enable the dynamic radio chatter service.

---
*Long live the Empire. Stay on target.*