import React, { useEffect, useRef } from 'react';

interface BloodCell {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation: number;
  rotationSpeed: number;
  vx: number;
  vy: number;
  opacity: number;
  depth: number; // 0.4 to 1.0 (parallax & scale)
  pulsePhase: number;
}

interface NetworkNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  pulse: number;
}

export const BloodCirculationCanvas: React.FC<{ intensity?: 'full' | 'subtle' }> = ({
  intensity = 'full'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Number of blood cells: sparser on small screens or subtle mode
    const isMobile = width < 768;
    const cellCount = intensity === 'subtle' 
      ? (isMobile ? 5 : 10) 
      : (isMobile ? 8 : 16);
    const nodeCount = isMobile ? 4 : 8;

    // Initialize stylized biconcave red blood cells
    const cells: BloodCell[] = [];
    for (let i = 0; i < cellCount; i++) {
      const depth = 0.4 + Math.random() * 0.6;
      const baseRadius = (16 + Math.random() * 18) * depth;
      cells.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radiusX: baseRadius * 1.3,
        radiusY: baseRadius * 0.9,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.006,
        vx: (0.15 + Math.random() * 0.25) * depth,
        vy: (Math.sin(i) * 0.15 + (Math.random() - 0.5) * 0.1) * depth,
        opacity: 0.25 + depth * 0.45,
        depth,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    // Network connection nodes
    const nodes: NetworkNode[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: 2.5 + Math.random() * 2,
        pulse: Math.random() * Math.PI * 2
      });
    }

    const drawErythrocyte = (
      ctx: CanvasRenderingContext2D,
      cell: BloodCell,
      time: number
    ) => {
      ctx.save();
      ctx.translate(cell.x, cell.y);
      ctx.rotate(cell.rotation);

      const pulse = Math.sin(time * 0.002 + cell.pulsePhase) * 0.05;
      const rx = cell.radiusX * (1 + pulse);
      const ry = cell.radiusY * (1 - pulse);

      // Outer rim gradient - softly illuminated crimson edge
      const outerGrad = ctx.createRadialGradient(0, 0, ry * 0.4, 0, 0, rx);
      outerGrad.addColorStop(0, `rgba(142, 27, 45, ${cell.opacity * 0.9})`); // deep crimson center
      outerGrad.addColorStop(0.65, `rgba(205, 38, 65, ${cell.opacity})`); // bright rich red body
      outerGrad.addColorStop(0.9, `rgba(235, 57, 85, ${cell.opacity * 0.85})`); // illuminated outer rim
      outerGrad.addColorStop(1, `rgba(180, 20, 40, 0)`); // soft boundary glow

      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = outerGrad;
      ctx.shadowColor = 'rgba(230, 45, 75, 0.4)';
      ctx.shadowBlur = 12 * cell.depth;
      ctx.fill();

      // Biconcave inner dimple (classic red blood cell concave center)
      const innerDimple = ctx.createRadialGradient(0, 0, 0, 0, 0, ry * 0.55);
      innerDimple.addColorStop(0, `rgba(45, 12, 22, ${cell.opacity * 0.8})`); // darker shaded depression
      innerDimple.addColorStop(0.7, `rgba(90, 18, 35, ${cell.opacity * 0.4})`);
      innerDimple.addColorStop(1, 'rgba(160, 25, 45, 0)');

      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.45, ry * 0.45, 0, 0, Math.PI * 2);
      ctx.fillStyle = innerDimple;
      ctx.shadowBlur = 0;
      ctx.fill();

      ctx.restore();
    };

    let lastTime = performance.now();

    const render = (time: number) => {
      // Clear with transparent layer
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle vascular circulation stream curves
      ctx.save();
      ctx.lineWidth = 1.2;
      const streamGrad = ctx.createLinearGradient(0, 0, width, height);
      streamGrad.addColorStop(0, 'rgba(143, 38, 59, 0.08)');
      streamGrad.addColorStop(0.5, 'rgba(198, 40, 69, 0.14)');
      streamGrad.addColorStop(1, 'rgba(81, 23, 39, 0.06)');
      ctx.strokeStyle = streamGrad;

      // Draw two smooth flowing curved capillary paths across the canvas
      ctx.beginPath();
      ctx.moveTo(0, height * 0.25);
      ctx.bezierCurveTo(
        width * 0.35,
        height * 0.15 + Math.sin(time * 0.0008) * 40,
        width * 0.65,
        height * 0.45 + Math.cos(time * 0.0006) * 40,
        width,
        height * 0.35
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, height * 0.7);
      ctx.bezierCurveTo(
        width * 0.4,
        height * 0.85 + Math.cos(time * 0.0007) * 35,
        width * 0.7,
        height * 0.6 + Math.sin(time * 0.0009) * 35,
        width,
        height * 0.75
      );
      ctx.stroke();

      // 2. Draw interconnected network nodes (hospital and donor hubs)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        }

        // Draw connections between nearby nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dist = Math.hypot(node.x - n2.x, node.y - n2.y);
          if (dist < 220) {
            const alpha = (1 - dist / 220) * 0.15;
            ctx.strokeStyle = `rgba(229, 57, 80, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }

        // Draw pulsating node glow
        const pulse = Math.sin(time * 0.003 + node.pulse) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size + pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 57, 80, ${0.3 + pulse * 0.3})`;
        ctx.shadowColor = 'rgba(230, 57, 80, 0.6)';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.restore();

      // 3. Draw and update floating stylized red blood cells
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        if (!prefersReducedMotion) {
          cell.x += cell.vx;
          cell.y += cell.vy;
          cell.rotation += cell.rotationSpeed;

          // Wrap around edges seamlessly
          if (cell.x - cell.radiusX > width) cell.x = -cell.radiusX;
          if (cell.x + cell.radiusX < -50) cell.x = width + cell.radiusX;
          if (cell.y - cell.radiusY > height) cell.y = -cell.radiusY;
          if (cell.y + cell.radiusY < -50) cell.y = height + cell.radiusY;
        }

        drawErythrocyte(ctx, cell, time);
      }

      if (!prefersReducedMotion && !document.hidden) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    if (prefersReducedMotion) {
      render(0);
    } else {
      animationFrameId = requestAnimationFrame(render);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{ opacity: intensity === 'subtle' ? 0.65 : 0.95 }}
      aria-hidden="true"
    />
  );
};
