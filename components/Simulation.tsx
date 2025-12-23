
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, PerspectiveCamera, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Enemy, Projectile, Explosion as ExplosionType } from '../types';

const TieFighter: React.FC<{ rotation: THREE.Euler, roll: number }> = ({ rotation, roll }) => {
  const compositeRotation = useMemo(() => {
    return new THREE.Euler(rotation.x, rotation.y, rotation.z + roll);
  }, [rotation.x, rotation.y, rotation.z, roll]);

  return (
    <group rotation={compositeRotation}>
      <mesh castShadow>
        <sphereGeometry args={[0.6, 24, 24]} />
        <meshStandardMaterial color="#2d2d2d" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.55]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.1, 8]} />
        <meshStandardMaterial color="#000" emissive="#003300" emissiveIntensity={1} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 2.5, 12]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {[-1.25, 1.25].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <mesh rotation={[0, 0, 0]}>
            <boxGeometry args={[0.08, 3.2, 2.4]} />
            <meshStandardMaterial color="#111" />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <boxGeometry args={[0.15, 3.4, 0.15]} />
            <meshStandardMaterial color="#555" />
          </mesh>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <boxGeometry args={[0.15, 2.6, 0.15]} />
            <meshStandardMaterial color="#555" />
          </mesh>
        </group>
      ))}
      <pointLight position={[0, 0, 0.6]} color="red" intensity={5} distance={3} />
      <mesh position={[0, 0, 0.55]}>
        <circleGeometry args={[0.22, 16]} />
        <meshBasicMaterial color="#ff1111" />
      </mesh>
    </group>
  );
};

const XWing: React.FC<{ position: [number, number, number], rotation: [number, number, number] }> = ({ position, rotation }) => {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.6, 0.6, 4.5]} />
        <meshStandardMaterial color="#d1d1d1" />
      </mesh>
      <mesh position={[0, 0, -2.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.3, 1, 8]} />
        <meshStandardMaterial color="#c1c1c1" />
      </mesh>
      <mesh position={[0, 0.35, -0.5]}>
        <boxGeometry args={[0.3, 0.2, 0.8]} />
        <meshStandardMaterial color="#333" transparent opacity={0.7} />
      </mesh>

      {[Math.PI/6, -Math.PI/6, Math.PI + Math.PI/6, Math.PI - Math.PI/6].map((angle, i) => (
        <group key={i} rotation={[0, 0, angle]}>
          <mesh position={[1.8, 0, 0.8]}>
            <boxGeometry args={[3.6, 0.1, 2]} />
            <meshStandardMaterial color="#ccc" />
          </mesh>
          <mesh position={[0.5, 0, 1.8]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 1.2, 12]} />
            <meshStandardMaterial color="#999" />
          </mesh>
          <mesh position={[0.5, 0, 2.4]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.25, 12]} />
            <meshBasicMaterial color="#ff4400" />
          </mesh>
          <mesh position={[3.5, 0, -1.2]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.5, 8]} />
            <meshStandardMaterial color="#666" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Explosion: React.FC<{ position: [number, number, number], scale: number }> = ({ position, scale }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useMemo(() => Date.now(), []);

  useFrame(() => {
    if (meshRef.current) {
        const elapsed = (Date.now() - startTime) / 1000;
        const s = scale * (1 + elapsed * 5);
        meshRef.current.scale.set(s, s, s);
        if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
            meshRef.current.material.opacity = 1 - elapsed;
        }
    }
  });

  return (
    <mesh position={position} ref={meshRef}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#ffaa00" transparent opacity={1} />
      <pointLight color="#ff4400" intensity={10} distance={50} />
    </mesh>
  );
};

const Laser: React.FC<{ position: [number, number, number], velocity: [number, number, number], color: string }> = ({ position, velocity, color }) => {
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3(...velocity).normalize();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v);
    return q;
  }, [velocity]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.08, 0.08, 5, 8]} />
      <meshBasicMaterial color={color} />
      <pointLight color={color} intensity={4} distance={6} />
    </mesh>
  );
};

const Scene = ({ 
  enemies, 
  projectiles, 
  explosions,
  playerPos, 
  playerRot,
  visualRoll,
  speed
}: { 
  enemies: Enemy[], 
  projectiles: Projectile[], 
  explosions: ExplosionType[],
  playerPos: THREE.Vector3, 
  playerRot: THREE.Euler,
  visualRoll: number,
  speed: number
}) => {
  const { camera } = useThree();
  const starsRef = useRef<THREE.Group>(null);
  const playerShipRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const baseOffset = new THREE.Vector3(0, 2.0, 9.0);
    const dynamicOffset = new THREE.Vector3(0, 0, speed * 0.2); 
    const combinedOffset = baseOffset.clone().add(dynamicOffset);
    
    combinedOffset.applyEuler(playerRot);
    const targetCameraPos = playerPos.clone().add(combinedOffset);
    camera.position.lerp(targetCameraPos, 0.25);
    
    const lookAtOffset = new THREE.Vector3(0, 0.4, -25);
    lookAtOffset.applyEuler(playerRot);
    const targetLookAt = playerPos.clone().add(lookAtOffset);
    camera.lookAt(targetLookAt);

    if (starsRef.current) starsRef.current.position.copy(playerPos);
    if (playerShipRef.current) playerShipRef.current.position.copy(playerPos);
  });

  return (
    <>
      <Stars ref={starsRef as any} radius={3000} depth={150} count={30000} factor={6} saturation={0} fade speed={2} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[100, 200, 100]} intensity={2} />
      
      <group ref={playerShipRef}>
        <TieFighter rotation={playerRot} roll={visualRoll} />
      </group>

      {enemies.map(enemy => (
        <XWing key={enemy.id} position={enemy.position} rotation={enemy.rotation} />
      ))}

      {projectiles.map(p => (
        <Laser 
          key={p.id} 
          position={p.position} 
          velocity={p.velocity} 
          color={p.owner === 'player' ? '#00ff44' : '#ff0000'} 
        />
      ))}

      {explosions.map(exp => (
        <Explosion key={exp.id} position={exp.position} scale={exp.scale} />
      ))}
      
      <mesh position={[15000, -5000, -25000]}>
        <sphereGeometry args={[4000, 64, 64]} />
        <meshStandardMaterial color="#0b1026" roughness={1} metalness={0.1} />
      </mesh>
    </>
  );
};

interface SimulationProps {
    enemies: Enemy[];
    projectiles: Projectile[];
    explosions: ExplosionType[];
    playerPos: THREE.Vector3;
    playerRot: THREE.Euler;
    visualRoll: number;
    speed: number;
}

const Simulation: React.FC<SimulationProps> = ({ enemies, projectiles, explosions, playerPos, playerRot, visualRoll, speed }) => {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault fov={55} near={0.1} far={100000} />
        <Scene 
            enemies={enemies} 
            projectiles={projectiles} 
            explosions={explosions}
            playerPos={playerPos} 
            playerRot={playerRot}
            visualRoll={visualRoll}
            speed={speed}
        />
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default Simulation;
