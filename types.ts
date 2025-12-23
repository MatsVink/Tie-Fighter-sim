
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Enemy {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  type: 'x-wing' | 'y-wing';
  lastShotTime: number;
}

export interface Projectile {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  owner: 'player' | 'enemy';
  createdAt: number;
}

export interface Explosion {
  id: string;
  position: [number, number, number];
  startTime: number;
  scale: number;
}

export interface GameState {
  score: number;
  health: number;
  energy: number;
  speed: number;
  isGameOver: boolean;
  enemies: Enemy[];
  projectiles: Projectile[];
  radioChatter: string[];
  explosions: Explosion[];
}
