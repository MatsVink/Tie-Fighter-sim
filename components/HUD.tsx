
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { GameState } from '../types';

interface HUDProps {
  state: GameState;
  radioMessages: string[];
  onRestart: () => void;
  playerPos: THREE.Vector3;
  playerRot: THREE.Euler;
}

const HUD: React.FC<HUDProps> = ({ state, radioMessages, onRestart, playerPos, playerRot }) => {
  // RADAR LOGIC: Transform enemy world positions to local radar coordinates
  const radarEnemies = useMemo(() => {
    const playerQuaternion = new THREE.Quaternion().setFromEuler(playerRot);
    const inverseQuaternion = playerQuaternion.clone().invert();
    
    return state.enemies.map(e => {
        const worldPos = new THREE.Vector3(...e.position);
        const relativePos = worldPos.clone().sub(playerPos);
        // Rotate the relative position by the inverse of player's rotation
        relativePos.applyQuaternion(inverseQuaternion);
        
        // Project onto XZ plane for 2D radar
        // Scaling for display (max radar range ~2000 units)
        const scale = 36 / 2000; 
        const rx = relativePos.x * scale;
        const rz = -relativePos.z * scale; // Flip Z for correct radar orientation
        
        // Clamp to radar bounds
        const dist = Math.sqrt(rx * rx + rz * rz);
        let finalX = rx;
        let finalZ = rz;
        if (dist > 60) { // Radar radius is ~70px
            finalX = (rx / dist) * 60;
            finalZ = (rz / dist) * 60;
        }

        return { id: e.id, x: finalX, z: finalZ, outOfBounds: dist > 60 };
    });
  }, [state.enemies, playerPos, playerRot]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-8 hud-font select-none">
      {/* Top Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
            <div className="text-green-500/50 text-[10px] tracking-[0.3em] uppercase">Tactical Link: Active</div>
            <div className="bg-green-950/20 border-l-2 border-green-500 p-4 w-80">
                <div className="text-green-400 text-xs italic opacity-90 leading-relaxed overflow-hidden h-10">
                    "{radioMessages[radioMessages.length - 1] || "Awaiting target confirmation..."}"
                </div>
            </div>
        </div>
        
        <div className="text-right">
            <div className="text-green-500/50 text-[10px] tracking-[0.3em] uppercase mb-1">Combat Rating</div>
            <div className="text-4xl font-bold text-green-500 tracking-tighter">
                {state.score.toString().padStart(4, '0')}
            </div>
        </div>
      </div>

      {/* Center Reticle */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40">
        <div className="relative w-40 h-40">
            <div className="absolute inset-0 border border-green-500/10 rounded-full scale-110"></div>
            <div className="absolute inset-4 border border-green-500/20 rounded-full"></div>
            <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-green-500"></div>
            <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-green-500"></div>
            <div className="absolute top-0 left-1/2 w-[1px] h-8 bg-green-500"></div>
            <div className="absolute bottom-0 left-1/2 w-[1px] h-8 bg-green-500"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-green-400 rounded-full shadow-[0_0_12px_#4ade80]"></div>
        </div>
      </div>

      {/* Bottom Interface */}
      <div className="flex justify-between items-end">
        {/* Left Status */}
        <div className="space-y-6">
            <div className="group">
                <div className="text-green-500/50 text-[10px] uppercase mb-1 flex justify-between w-48">
                    <span>Hull Integrity</span>
                    <span>{state.health}%</span>
                </div>
                <div className="w-48 h-2 bg-zinc-900 overflow-hidden border border-green-500/20">
                    <div 
                        className={`h-full transition-all duration-300 ${state.health < 30 ? 'bg-red-600 animate-pulse' : 'bg-green-500'}`}
                        style={{ width: `${state.health}%` }}
                    ></div>
                </div>
            </div>
            <div>
                <div className="text-blue-500/50 text-[10px] uppercase mb-1 flex justify-between w-48">
                    <span>Laser Power</span>
                    <span>{Math.floor(state.energy)}%</span>
                </div>
                <div className="w-48 h-2 bg-zinc-900 overflow-hidden border border-blue-500/20">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${state.energy}%` }}
                    ></div>
                </div>
            </div>
        </div>

        {/* Functional Radar */}
        <div className="relative w-40 h-40 bg-green-950/5 border border-green-500/20 rounded-full flex items-center justify-center shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]">
            <div className="absolute inset-0 border border-green-500/10 rounded-full scale-75"></div>
            <div className="absolute inset-0 border border-green-500/10 rounded-full scale-50"></div>
            {/* Center crosshair */}
            <div className="absolute w-full h-[1px] bg-green-500/10"></div>
            <div className="absolute h-full w-[1px] bg-green-500/10"></div>
            
            {/* Player Marker */}
            <div className="w-2 h-2 bg-green-400 rounded-full shadow-[0_0_5px_green] z-10"></div>
            
            {radarEnemies.map((e) => (
                <div 
                    key={e.id}
                    className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-100 ${e.outOfBounds ? 'bg-red-900 opacity-50' : 'bg-red-500 animate-pulse'}`}
                    style={{ 
                        transform: `translate(${e.x}px, ${e.z}px)`,
                        boxShadow: e.outOfBounds ? 'none' : '0 0 5px #ef4444'
                    }}
                ></div>
            ))}
            <div className="absolute inset-0 border-t border-green-500/40 animate-spin origin-center rounded-full" style={{ animationDuration: '3s' }}></div>
        </div>

        {/* Right Status */}
        <div className="text-right space-y-4">
            <div>
                <div className="text-green-500/50 text-[10px] uppercase mb-1">Thrust Output</div>
                <div className="text-4xl font-bold text-green-500">
                    {Math.round(state.speed * 100)}<span className="text-xs ml-2 font-light opacity-50 uppercase tracking-widest">mglt</span>
                </div>
            </div>
            <div className="text-[10px] text-green-800 uppercase tracking-[0.2em] leading-tight font-bold">
                Reactor: Online<br/>
                Sensors: Scanning<br/>
                IFF: Imperial
            </div>
        </div>
      </div>

      {state.isGameOver && (
        <div className="absolute inset-0 bg-red-950/60 backdrop-blur-lg flex items-center justify-center pointer-events-auto">
          <div className="bg-black border-2 border-red-500 p-16 text-center shadow-[0_0_100px_rgba(239,68,68,0.3)]">
            <h1 className="text-8xl font-black text-red-600 mb-2 hud-font tracking-tighter italic">KIA</h1>
            <p className="text-red-400 mb-12 uppercase tracking-[1em] text-xs font-bold opacity-80">Vessel Destroyed</p>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onRestart();
              }}
              className="px-16 py-4 bg-red-600 text-black font-black hover:bg-red-500 transition-all uppercase tracking-widest text-sm transform hover:scale-110 active:scale-95 shadow-lg"
            >
              Re-Deploy Pilot
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HUD;
