
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'this-is-not-real-but-three-is-imported-via-esm';
import * as THREE_LIB from 'three';
import Simulation from './components/Simulation';
import HUD from './components/HUD';
import { GameState, Enemy, Projectile, Explosion } from './types';
import { getImperialChatter } from './services/geminiService';

const THREE = THREE_LIB;

const INITIAL_STATE: GameState = {
  score: 0,
  health: 100,
  energy: 100,
  speed: 0.1,
  isGameOver: false,
  enemies: [],
  projectiles: [],
  radioChatter: ["Command: Tie Fighter units deployed. Engage rebels."],
  explosions: [],
};

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [isLocked, setIsLocked] = useState(false);
  
  // Audio Ref for Ambient Music
  const musicRef = useRef<HTMLAudioElement | null>(null);
  
  // Physics & Transform Refs
  const playerPos = useRef(new THREE.Vector3(0, 0, 0));
  const playerRot = useRef(new THREE.Euler(0, 0, 0));
  const playerVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const visualRoll = useRef(0);
  
  // Input velocity for rotation (smoothing)
  const rotationVelocity = useRef({ x: 0, y: 0 });
  
  const keysPressed = useRef<Set<string>>(new Set());
  const lastShotTime = useRef(0);
  const frameId = useRef<number>(0);
  const enemyTargets = useRef<Record<string, THREE.Vector3>>({});

  // Initialize Audio
  useEffect(() => {
    // Cinematic Sci-Fi Ambient track
    const audio = new Audio('https://cdn.pixabay.com/audio/2021/11/25/audio_91b123f051.mp3');
    audio.loop = true;
    audio.volume = 0.3; // Ambient level
    musicRef.current = audio;

    return () => {
      audio.pause();
      musicRef.current = null;
    };
  }, []);

  // Handle Music Playback based on game state
  useEffect(() => {
    if (isLocked && !state.isGameOver) {
      musicRef.current?.play().catch(err => console.debug("Audio play blocked until interaction:", err));
    } else {
      musicRef.current?.pause();
    }
  }, [isLocked, state.isGameOver]);

  const restartGame = useCallback(() => {
    setState(INITIAL_STATE);
    playerPos.current.set(0, 0, 0);
    playerRot.current.set(0, 0, 0);
    playerVelocity.current.set(0, 0, 0);
    visualRoll.current = 0;
    rotationVelocity.current = { x: 0, y: 0 };
    enemyTargets.current = {};
  }, []);

  useEffect(() => {
    const handleLock = () => {
        const locked = document.pointerLockElement === document.body;
        setIsLocked(locked);
    };
    document.addEventListener('pointerlockchange', handleLock);
    return () => document.removeEventListener('pointerlockchange', handleLock);
  }, []);

  const requestLock = () => {
    document.body.requestPointerLock();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (!isLocked || state.isGameOver) return;
        
        const sens = 0.0008;
        rotationVelocity.current.y -= e.movementX * sens;
        rotationVelocity.current.x -= e.movementY * sens;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        keysPressed.current.delete(e.key.toLowerCase());
    };

    const handleMouseDown = () => {
        if (!isLocked) {
            requestLock();
            return;
        }
        if (!state.isGameOver) shoot();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        window.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isLocked, state.isGameOver]);

  const shoot = useCallback(() => {
    const now = Date.now();
    if (now - lastShotTime.current < 120) return; 
    
    setState(prev => {
        if (prev.energy < 2) return prev;
        
        lastShotTime.current = now;
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(playerRot.current);
        const isLeft = now % 2 === 0;
        const offset = new THREE.Vector3(isLeft ? -0.8 : 0.8, -0.2, 0).applyEuler(playerRot.current);
        const spawnPos = playerPos.current.clone().add(offset);

        const newProjectile: Projectile = {
            id: Math.random().toString(),
            position: [spawnPos.x, spawnPos.y, spawnPos.z] as [number, number, number],
            velocity: [direction.x * 20, direction.y * 20, direction.z * 20] as [number, number, number],
            owner: 'player',
            createdAt: now
        };

        return {
            ...prev,
            energy: Math.max(0, prev.energy - 3),
            projectiles: [...prev.projectiles, newProjectile]
        };
    });
  }, []);

  const triggerChatter = useCallback(async (event: string) => {
    const msg = await getImperialChatter(event);
    setState(prev => ({
        ...prev,
        radioChatter: [...prev.radioChatter, msg].slice(-4)
    }));
  }, []);

  const update = useCallback(() => {
    if (state.isGameOver) return;

    // Apply rotation smoothing
    playerRot.current.y += rotationVelocity.current.y;
    playerRot.current.x += rotationVelocity.current.x;
    playerRot.current.x = THREE.MathUtils.clamp(playerRot.current.x, -Math.PI/2.3, Math.PI/2.3);
    
    // Friction for rotation velocity
    rotationVelocity.current.x *= 0.85;
    rotationVelocity.current.y *= 0.85;

    // 1. Process Input for Movement
    const moveDir = new THREE.Vector3(0, 0, 0);
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(playerRot.current);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(playerRot.current);

    if (keysPressed.current.has('w')) moveDir.add(forward);
    if (keysPressed.current.has('s')) moveDir.add(forward.clone().negate());
    if (keysPressed.current.has('a')) {
        moveDir.add(right.clone().negate());
        visualRoll.current = THREE.MathUtils.lerp(visualRoll.current, 0.2, 0.05);
    }
    if (keysPressed.current.has('d')) {
        moveDir.add(right);
        visualRoll.current = THREE.MathUtils.lerp(visualRoll.current, -0.2, 0.05);
    }
    
    // Automatic banking based on horizontal steering
    visualRoll.current = THREE.MathUtils.lerp(visualRoll.current, -rotationVelocity.current.y * 15, 0.1);

    const targetSpeed = keysPressed.current.size > 0 ? 6.5 : 2.5;
    playerVelocity.current.lerp(moveDir.normalize().multiplyScalar(targetSpeed), 0.08);
    playerPos.current.add(playerVelocity.current);

    const currentSpeedMag = playerVelocity.current.length() / 6.5;
    
    setState(prev => {
        const now = Date.now();
        
        // Update Projectiles
        const updatedProjectiles: Projectile[] = prev.projectiles
            .filter(p => now - p.createdAt < 2200)
            .map(p => ({
                ...p,
                position: [
                    p.position[0] + p.velocity[0],
                    p.position[1] + p.velocity[1],
                    p.position[2] + p.velocity[2]
                ] as [number, number, number]
            }));

        // Update Explosions
        const updatedExplosions = prev.explosions.filter(exp => now - exp.startTime < 1000);

        let newScore = prev.score;
        let newHealth = prev.health;

        // Update Enemies
        const updatedEnemies: Enemy[] = prev.enemies.map(enemy => {
            let enemyHealth = enemy.health;
            const ePos = new THREE.Vector3(...enemy.position);
            
            if (!enemyTargets.current[enemy.id] || Math.random() < 0.02) {
                const offset = new THREE.Vector3(
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400
                );
                enemyTargets.current[enemy.id] = playerPos.current.clone().add(offset);
            }

            const target = enemyTargets.current[enemy.id];
            const toTarget = target.clone().sub(ePos).normalize();
            ePos.add(toTarget.multiplyScalar(2.2));

            // Collision with player lasers
            updatedProjectiles.forEach((p, idx) => {
                if (p.owner === 'player') {
                    const dist = ePos.distanceTo(new THREE.Vector3(...p.position));
                    if (dist < 15) {
                        enemyHealth -= 50;
                        updatedProjectiles.splice(idx, 1);
                    }
                }
            });

            const rot: [number, number, number] = [
                Math.atan2(toTarget.y, toTarget.z),
                Math.atan2(toTarget.x, toTarget.z),
                0
            ];

            return { ...enemy, position: [ePos.x, ePos.y, ePos.z] as [number, number, number], rotation: rot, health: enemyHealth };
        }).filter(e => {
            if (e.health <= 0) {
                newScore += 100;
                updatedExplosions.push({
                    id: Math.random().toString(),
                    position: e.position,
                    startTime: now,
                    scale: 2 + Math.random() * 2
                });
                triggerChatter("Target destroyed. Commencing next sweep.");
                return false;
            }
            return true;
        });

        if (updatedEnemies.length < 5) {
            const spawnDir = new THREE.Vector3(
                (Math.random() - 0.5),
                (Math.random() - 0.5),
                -1
            ).normalize().applyEuler(playerRot.current);
            const spawnPos = playerPos.current.clone().add(spawnDir.multiplyScalar(1500 + Math.random() * 500));
            
            updatedEnemies.push({
                id: Math.random().toString(),
                position: [spawnPos.x, spawnPos.y, spawnPos.z] as [number, number, number],
                rotation: [0, 0, 0] as [number, number, number],
                health: 100,
                type: 'x-wing',
                lastShotTime: 0
            });
        }

        updatedProjectiles.forEach((p, idx) => {
            if (p.owner === 'enemy') {
                const dist = playerPos.current.distanceTo(new THREE.Vector3(...p.position));
                if (dist < 6) {
                    newHealth -= 10;
                    updatedProjectiles.splice(idx, 1);
                }
            }
        });

        return {
            ...prev,
            score: newScore,
            health: newHealth,
            speed: currentSpeedMag,
            energy: Math.min(100, prev.energy + 0.6),
            enemies: updatedEnemies,
            projectiles: updatedProjectiles,
            isGameOver: newHealth <= 0,
            explosions: updatedExplosions
        };
    });

    frameId.current = requestAnimationFrame(update);
  }, [state.isGameOver, triggerChatter, isLocked]);

  useEffect(() => {
    frameId.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId.current);
  }, [update]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
        <Simulation 
            enemies={state.enemies} 
            projectiles={state.projectiles} 
            explosions={state.explosions}
            playerPos={playerPos.current}
            playerRot={playerRot.current}
            visualRoll={visualRoll.current}
            speed={state.speed}
        />
        <HUD 
          state={state} 
          radioMessages={state.radioChatter} 
          onRestart={restartGame} 
          playerPos={playerPos.current}
          playerRot={playerRot.current}
        />
        
        {!isLocked && !state.isGameOver && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-8 backdrop-blur-md">
                <div className="max-w-xl border-2 border-green-500/30 p-10 bg-black/90 shadow-2xl rounded-sm">
                    <h1 className="text-4xl font-bold text-green-500 mb-4 hud-font tracking-tighter">IMPERIAL TIE FIGHTER SIM</h1>
                    <p className="text-green-700 mb-8 uppercase text-xs tracking-widest font-bold">Authorized Personnel Only</p>
                    <p className="text-zinc-400 mb-8 leading-relaxed font-light">
                         Welcome back, pilot. Rebels detected at short range. Neutralize them immediately.
                    </p>
                    <button 
                        onClick={requestLock}
                        className="w-full py-4 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black font-bold transition-all uppercase tracking-widest text-sm"
                    >
                        START ENGINES
                    </button>
                    <div className="mt-6 flex justify-between text-[10px] text-green-900 font-bold uppercase tracking-widest">
                        <span>W/S: Throttle</span>
                        <span>A/D: Strafe (Reduced)</span>
                        <span>Mouse: Precision Steering</span>
                        <span>Click: Lasers</span>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default App;
