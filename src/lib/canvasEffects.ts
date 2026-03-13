// Canvas animation effects - particles, smoke, flags, water, lighting

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'build' | 'smoke' | 'sparkle' | 'coin' | 'leaf' | 'firefly';
  rotation?: number;
}

let particles: Particle[] = [];

export function addBuildParticles(sx: number, sy: number) {
  for (let i = 0; i < 16; i++) {
    const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
    const speed = 1 + Math.random() * 2.5;
    particles.push({
      x: sx, y: sy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 35 + Math.random() * 25,
      maxLife: 60,
      size: 2 + Math.random() * 3,
      color: ['#c4a35a', '#8b7355', '#d4a853', '#a08050', '#e8c868'][Math.floor(Math.random() * 5)],
      type: 'build',
    });
  }
}

export function addSmokeParticle(sx: number, sy: number) {
  particles.push({
    x: sx + (Math.random() - 0.5) * 6,
    y: sy,
    vx: (Math.random() - 0.5) * 0.2 + Math.sin(Date.now() * 0.001) * 0.15,
    vy: -0.25 - Math.random() * 0.25,
    life: 50 + Math.random() * 40,
    maxLife: 90,
    size: 2 + Math.random() * 3,
    color: '#999',
    type: 'smoke',
  });
}

export function addCoinParticle(sx: number, sy: number) {
  particles.push({
    x: sx, y: sy,
    vx: (Math.random() - 0.5) * 1.2,
    vy: -1.8 - Math.random(),
    life: 45,
    maxLife: 45,
    size: 4,
    color: '#f5a623',
    type: 'coin',
    rotation: Math.random() * Math.PI * 2,
  });
}

export function addSparkle(sx: number, sy: number) {
  particles.push({
    x: sx + (Math.random() - 0.5) * 20,
    y: sy + (Math.random() - 0.5) * 10,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -0.4 - Math.random() * 0.3,
    life: 25 + Math.random() * 15,
    maxLife: 40,
    size: 1.5 + Math.random() * 2.5,
    color: ['#ffe066', '#fff8cc', '#ffcc00'][Math.floor(Math.random() * 3)],
    type: 'sparkle',
  });
}

export function addLeafParticle(sx: number, sy: number) {
  particles.push({
    x: sx + (Math.random() - 0.5) * 30,
    y: sy,
    vx: 0.3 + Math.random() * 0.5,
    vy: 0.2 + Math.random() * 0.3,
    life: 80 + Math.random() * 60,
    maxLife: 140,
    size: 2 + Math.random() * 2,
    color: ['#4a8a3a', '#6aaa4a', '#8aba5a', '#c4a040'][Math.floor(Math.random() * 4)],
    type: 'leaf',
    rotation: Math.random() * Math.PI * 2,
  });
}

export function addFirefly(sx: number, sy: number) {
  particles.push({
    x: sx + (Math.random() - 0.5) * 60,
    y: sy + (Math.random() - 0.5) * 30,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.3,
    life: 100 + Math.random() * 80,
    maxLife: 180,
    size: 1.5 + Math.random(),
    color: '#ffee88',
    type: 'firefly',
  });
}

export function updateParticles() {
  particles = particles.filter(p => p.life > 0);
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.type === 'smoke') {
      p.size += 0.08;
      p.vx *= 0.97;
    }
    if (p.type === 'build') p.vy += 0.05;
    if (p.type === 'coin') {
      p.vy += 0.04;
      if (p.rotation !== undefined) p.rotation += 0.15;
    }
    if (p.type === 'leaf') {
      p.vx += Math.sin(p.life * 0.08) * 0.02;
      p.vy += 0.005;
      if (p.rotation !== undefined) p.rotation += 0.03;
    }
    if (p.type === 'firefly') {
      p.vx += (Math.random() - 0.5) * 0.08;
      p.vy += (Math.random() - 0.5) * 0.06;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D) {
  for (const p of particles) {
    const alpha = p.life / p.maxLife;

    if (p.type === 'sparkle') {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      const s = p.size * (1 + (1 - alpha) * 0.5);
      ctx.beginPath();
      // 4-point star
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8;
        const r = i % 2 === 0 ? s : s * 0.35;
        const px = p.x + Math.cos(angle) * r;
        const py = p.y + Math.sin(angle) * r;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // Glow
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, s * 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    } else if (p.type === 'coin') {
      ctx.globalAlpha = alpha;
      // Coin with perspective
      const squish = Math.abs(Math.cos(p.rotation || 0));
      ctx.fillStyle = '#f5a623';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * squish, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d48a10';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else if (p.type === 'smoke') {
      ctx.globalAlpha = alpha * 0.4;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
      grad.addColorStop(0, 'rgba(180,180,180,0.5)');
      grad.addColorStop(1, 'rgba(180,180,180,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'leaf') {
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation || 0);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (p.type === 'firefly') {
      const pulse = Math.sin(p.life * 0.15) * 0.5 + 0.5;
      ctx.globalAlpha = alpha * pulse;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
      grad.addColorStop(0, 'rgba(255,238,136,0.8)');
      grad.addColorStop(0.5, 'rgba(255,238,136,0.2)');
      grad.addColorStop(1, 'rgba(255,238,136,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffcc';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Animated flag with wind physics
export function drawFlag(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const windStrength = Math.sin(time * 0.7) * 0.3 + 0.7;

  // Pole with gradient
  const poleGrad = ctx.createLinearGradient(x - 1, y, x + 1, y);
  poleGrad.addColorStop(0, '#888');
  poleGrad.addColorStop(0.5, '#bbb');
  poleGrad.addColorStop(1, '#777');
  ctx.strokeStyle = poleGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 16);
  ctx.stroke();

  // Pole top ball
  ctx.fillStyle = '#ddd';
  ctx.beginPath();
  ctx.arc(x, y - 16.5, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Flag with wave physics
  ctx.beginPath();
  ctx.moveTo(x, y - 15);
  const segments = 5;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const fx = x + t * 12 * windStrength;
    const fy = y - 15 + t * 2 + Math.sin(time * 4 + t * 3) * 1.5 * windStrength;
    i === 0 ? ctx.moveTo(fx, fy) : ctx.lineTo(fx, fy);
  }
  for (let i = segments; i >= 0; i--) {
    const t = i / segments;
    const fx = x + t * 12 * windStrength;
    const fy = y - 10 + t * 2 + Math.sin(time * 4 + t * 3 + 0.5) * 1.5 * windStrength;
    ctx.lineTo(fx, fy);
  }
  ctx.closePath();

  // Portuguese flag gradient
  const flagGrad = ctx.createLinearGradient(x, y - 15, x + 12, y - 10);
  flagGrad.addColorStop(0, '#006600');
  flagGrad.addColorStop(0.4, '#008800');
  flagGrad.addColorStop(0.4, '#cc0000');
  flagGrad.addColorStop(1, '#aa0000');
  ctx.fillStyle = flagGrad;
  ctx.fill();
}

// Realistic water shimmer
export function drawWaterShimmer(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, time: number) {
  const shimmer = Math.sin(time * 2 + x * 0.1) * 0.15 + 0.85;
  ctx.globalAlpha = shimmer * 0.7;

  const grad = ctx.createRadialGradient(x - 2, y - 2, 0, x, y, size * 0.4);
  grad.addColorStop(0, 'rgba(150, 210, 255, 0.8)');
  grad.addColorStop(0.6, 'rgba(100, 176, 232, 0.5)');
  grad.addColorStop(1, 'rgba(100, 176, 232, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.35, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle highlights
  for (let i = 0; i < 3; i++) {
    const sparkleTime = time * 3 + i * 2.1;
    const sparkleAlpha = Math.max(0, Math.sin(sparkleTime) * 0.5);
    if (sparkleAlpha > 0.1) {
      ctx.globalAlpha = sparkleAlpha * shimmer;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x + Math.cos(i * 2.5) * size * 0.2, y + Math.sin(i * 1.7) * size * 0.1, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// Ambient atmosphere overlay
export function drawAtmosphere(ctx: CanvasRenderingContext2D, w: number, h: number, time: number) {
  // Subtle vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,10,0,0.15)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // Subtle sunlight rays from top-left
  const sunAlpha = 0.03 + Math.sin(time * 0.3) * 0.01;
  ctx.globalAlpha = sunAlpha;
  const sunGrad = ctx.createLinearGradient(0, 0, w * 0.7, h * 0.7);
  sunGrad.addColorStop(0, 'rgba(255,240,180,1)');
  sunGrad.addColorStop(0.5, 'rgba(255,240,180,0.3)');
  sunGrad.addColorStop(1, 'rgba(255,240,180,0)');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = 1;
}

export function getParticles() { return particles; }
export function clearParticles() { particles = []; }
