// Subtle boids-style flock of dots that drifts behind everything.
// Uses only palette hues (sage + chartreuse). Very low opacity so it reads
// as ambient motion, not decoration. The liquid-glass cards pick up the
// motion through their backdrop-filter.

function FlockCanvas() {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Particles
    const N = 70;
    const particles = [];
    for (let i = 0; i < N; i++) {
      const isAccent = Math.random() < 0.14;
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        accent: isAccent,
        r: isAccent ? (2.2 + Math.random() * 1.2) : (1.4 + Math.random() * 1.2),
      });
    }

    // Flocking constants (tuned for slow, graceful motion)
    const NEIGHBOR_RADIUS = 140;
    const SEP_RADIUS = 32;
    const ALIGN_STRENGTH = 0.012;
    const COHESION_STRENGTH = 0.00004;
    const SEP_STRENGTH = 0.025;
    const MAX_SPEED = 0.7;
    const MIN_SPEED = 0.15;

    let raf;
    const step = () => {
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < N; i++) {
        const p = particles[i];

        let avgVx = 0, avgVy = 0;
        let avgX = 0, avgY = 0;
        let sepX = 0, sepY = 0;
        let nCount = 0;

        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const q = particles[j];
          const dx = q.x - p.x, dy = q.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < NEIGHBOR_RADIUS * NEIGHBOR_RADIUS) {
            nCount++;
            avgVx += q.vx;
            avgVy += q.vy;
            avgX += q.x;
            avgY += q.y;
            if (d2 < SEP_RADIUS * SEP_RADIUS && d2 > 0.01) {
              const d = Math.sqrt(d2);
              sepX -= dx / d;
              sepY -= dy / d;
            }
          }
        }

        if (nCount > 0) {
          avgVx /= nCount;
          avgVy /= nCount;
          avgX /= nCount;
          avgY /= nCount;
          p.vx += (avgVx - p.vx) * ALIGN_STRENGTH;
          p.vy += (avgVy - p.vy) * ALIGN_STRENGTH;
          p.vx += (avgX - p.x) * COHESION_STRENGTH;
          p.vy += (avgY - p.y) * COHESION_STRENGTH;
          p.vx += sepX * SEP_STRENGTH;
          p.vy += sepY * SEP_STRENGTH;
        }

        // Speed limits
        const sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (sp > MAX_SPEED) {
          p.vx = (p.vx / sp) * MAX_SPEED;
          p.vy = (p.vy / sp) * MAX_SPEED;
        } else if (sp < MIN_SPEED && sp > 0) {
          p.vx = (p.vx / sp) * MIN_SPEED;
          p.vy = (p.vy / sp) * MIN_SPEED;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;

        // Draw
        if (p.accent) {
          ctx.fillStyle = 'oklch(94% 0.19 115 / 0.5)';
          ctx.shadowColor = 'oklch(94% 0.19 115 / 0.55)';
          ctx.shadowBlur = 14;
        } else {
          ctx.fillStyle = 'oklch(92% 0.02 170 / 0.28)';
          ctx.shadowBlur = 0;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(step);
    };
    step();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{
      position:'fixed',
      inset:0,
      width:'100vw',
      height:'100vh',
      pointerEvents:'none',
      zIndex:0,
    }} />
  );
}

window.FlockCanvas = FlockCanvas;
