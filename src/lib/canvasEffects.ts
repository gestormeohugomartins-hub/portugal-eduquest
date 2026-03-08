// Canvas animation effects - particles, smoke, flags, water

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'build' | 'smoke' | 'sparkle' | 'coin';
}

let particles: Particle[] = [];

export function addBuildParticles(sx: number, sy: number) {
  for (let i = 0; i < 12; i++) {
    particles.push({
      x: sx, y: sy,
      vx: (Math.random() - 0.5) * 3,
      vy: -Math.random() * 2 - 1,
      life: 30 + Math.random() * 20,
      maxLife: 50,
      size: 2 + Math.random() * 3,
      color: ['#c4a35a', '#8b7355', '#d4a853', '#a08050'][Math.floor(Math.random() * 4)],
      type: 'build',
    });
  }
}

export function addSmokeParticle(sx: number, sy: number) {
  particles.push({
    x: sx + (Math.random() - 0.5) * 6,
    y: sy,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -0.3 - Math.random() * 0.3,
    life: 40 + Math.random() * 30,
    maxLife: 70,
    size: 3 + Math.random() * 4,
    color: '#888',
    type: 'smoke',
  });
}

export function addCoinParticle(sx: number, sy: number) {
  particles.push({
    x: sx, y: sy,
    vx: (Math.random() - 0.5) * 1,
    vy: -1.5 - Math.random(),
    life: 40,
    maxLife: 40,
    size: 4,
    color: '#f5a623',
    type: 'coin',
  });
}

export function addSparkle(sx: number, sy: number) {
  particles.push({
    x: sx + (Math.random() - 0.5) * 20,
    y: sy + (Math.random() - 0.5) * 10,
    vx: 0, vy: -0.5,
    life: 20 + Math.random() * 15,
    maxLife: 35,
    size: 2 + Math.random() * 2,
    color: '#ffe066',
    type: 'sparkle',
  });
}

export function updateParticles() {
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.type === 'smoke') {
      p.size += 0.05;
      p.vx *= 0.98;
    }
    if (p.type === 'build') p.vy += 0.05; // gravity
    if (p.type === 'coin') p.vy += 0.04;
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;
    ctx.globalAlpha = alpha;
    
    if (p.type === 'sparkle') {
      // Star shape
      ctx.fillStyle = p.color;
      ctx.beginPath();
      const s = p.size;
      ctx.moveTo(p.x, p.y - s);
      ctx.lineTo(p.x + s * 0.3, p.y - s * 0.3);
      ctx.lineTo(p.x + s, p.y);
      ctx.lineTo(p.x + s * 0.3, p.y + s * 0.3);
      ctx.lineTo(p.x, p.y + s);
      ctx.lineTo(p.x - s * 0.3, p.y + s * 0.3);
      ctx.lineTo(p.x - s, p.y);
      ctx.lineTo(p.x - s * 0.3, p.y - s * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (p.type === 'coin') {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 6px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$', p.x, p.y + 2);
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Animated flag for towers
export function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const waveOffset = Math.sin(time * 3) * 3;
  ctx.strokeStyle = '#666';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 14);
  ctx.stroke();

  // Flag
  ctx.fillStyle = '#c41e3a'; // Portuguese red
  ctx.beginPath();
  ctx.moveTo(x, y - 14);
  ctx.quadraticCurveTo(x + 5, y - 12 + waveOffset, x + 10, y - 13);
  ctx.lineTo(x + 10, y - 8 + waveOffset * 0.5);
  ctx.quadraticCurveTo(x + 5, y - 7 + waveOffset, x, y - 9);
  ctx.closePath();
  ctx.fill();
}

// Water animation
export function drawWaterShimmer(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number) {
  const shimmer = Math.sin(time * 2 + x * 0.1) * 0.15 + 0.85;
  ctx.globalAlpha = shimmer;
  ctx.fillStyle = '#6ab0e8';
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.3, size * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function getParticles() { return particles; }
export function clearParticles() { particles = []; }
