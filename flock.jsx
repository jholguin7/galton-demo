// Ambient flocking points behind the UI.
// Classic Craig Reynolds boids (separation + alignment + cohesion) with
// mouse repulsion. Small, dense, palette-compliant.

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

    // Mouse tracking (page-global so pointer-events:none canvas still reads it)
    const mouse = { x: -9999, y: -9999, active: false };
    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    // Denser population
    const N = 180;
    const particles = [];
    for (let i = 0; i < N; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.4 + Math.random() * 0.4;
      const isAccent = Math.random() < 0.08;
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        accent: isAccent,
        r: isAccent ? 1.2 : 0.8,
      });
    }

    // Reynolds flocking — tuned so flocks stay small & distributed
    // rather than collapsing into one giant cluster
    const SEP_RADIUS     = 20;
    const ALIGN_RADIUS   = 40;
    const COHESION_RADIUS = 28;
    const SEP_WEIGHT     = 1.8;
    const ALIGN_WEIGHT   = 1.0;
    const COHESION_WEIGHT = 0.35;
    const MAX_SPEED      = 1.0;
    const MAX_FORCE      = 0.04;

    // Mouse repulsion
    const MOUSE_RADIUS = 120;
    const MOUSE_FORCE  = 0.8;

    const limit = (vx, vy, max) => {
      const m = Math.sqrt(vx * vx + vy * vy);
      if (m > max) return { x: (vx / m) * max, y: (vy / m) * max };
      return { x: vx, y: vy };
    };

    let raf;
    const step = () => {
      ctx.clearRect(0, 0, W, H);

      for (let i = 0; i < N; i++) {
        const p = particles[i];

        // Accumulators for the 3 classic rules
        let sepX = 0, sepY = 0, sepCount = 0;
        let alignVx = 0, alignVy = 0, alignCount = 0;
        let cohX = 0, cohY = 0, cohCount = 0;

        for (let j = 0; j < N; j++) {
          if (i === j) continue;
          const q = particles[j];
          const dx = q.x - p.x, dy = q.y - p.y;
          const d2 = dx * dx + dy * dy;

          if (d2 < SEP_RADIUS * SEP_RADIUS && d2 > 0.01) {
            const d = Math.sqrt(d2);
            sepX -= dx / d;
            sepY -= dy / d;
            sepCount++;
          }
          if (d2 < ALIGN_RADIUS * ALIGN_RADIUS) {
            alignVx += q.vx;
            alignVy += q.vy;
            alignCount++;
          }
          if (d2 < COHESION_RADIUS * COHESION_RADIUS) {
            cohX += q.x;
            cohY += q.y;
            cohCount++;
          }
        }

        // Steering forces (steer = desired - velocity, clamped)
        let ax = 0, ay = 0;

        if (sepCount > 0) {
          sepX /= sepCount;
          sepY /= sepCount;
          const desired = limit(sepX, sepY, MAX_SPEED);
          const steer = limit(desired.x - p.vx, desired.y - p.vy, MAX_FORCE);
          ax += steer.x * SEP_WEIGHT;
          ay += steer.y * SEP_WEIGHT;
        }

        if (alignCount > 0) {
          alignVx /= alignCount;
          alignVy /= alignCount;
          const desired = limit(alignVx, alignVy, MAX_SPEED);
          const steer = limit(desired.x - p.vx, desired.y - p.vy, MAX_FORCE);
          ax += steer.x * ALIGN_WEIGHT;
          ay += steer.y * ALIGN_WEIGHT;
        }

        if (cohCount > 0) {
          cohX /= cohCount;
          cohY /= cohCount;
          const desiredX = cohX - p.x;
          const desiredY = cohY - p.y;
          const desired = limit(desiredX, desiredY, MAX_SPEED);
          const steer = limit(desired.x - p.vx, desired.y - p.vy, MAX_FORCE);
          ax += steer.x * COHESION_WEIGHT;
          ay += steer.y * COHESION_WEIGHT;
        }

        // Mouse repulsion
        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const md2 = mdx * mdx + mdy * mdy;
          if (md2 < MOUSE_RADIUS * MOUSE_RADIUS && md2 > 0.01) {
            const md = Math.sqrt(md2);
            // Falloff: stronger when closer
            const falloff = (1 - md / MOUSE_RADIUS);
            ax += (mdx / md) * MOUSE_FORCE * falloff;
            ay += (mdy / md) * MOUSE_FORCE * falloff;
          }
        }

        // Apply acceleration, limit velocity
        p.vx += ax;
        p.vy += ay;
        const v = limit(p.vx, p.vy, MAX_SPEED);
        p.vx = v.x;
        p.vy = v.y;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < -4) p.x = W + 4;
        if (p.x > W + 4) p.x = -4;
        if (p.y < -4) p.y = H + 4;
        if (p.y > H + 4) p.y = -4;

        // Render as a crisp point (no shadow blur, no glow — keeps it clean)
        if (p.accent) {
          ctx.fillStyle = 'oklch(94% 0.19 115 / 0.75)';
        } else {
          ctx.fillStyle = 'oklch(95% 0.02 170 / 0.38)';
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(step);
    };
    step();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
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
