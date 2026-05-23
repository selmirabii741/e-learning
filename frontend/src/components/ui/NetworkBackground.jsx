'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Animated network background rendered BEHIND content (z-index: 0).
 * Cards and UI elements sit on top (z-index: 1+) with opaque backgrounds,
 * so particles are only visible in the gaps/margins between content.
 */
export default function NetworkBackground({ mode = 'dark' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animationFrameId;
    let particles = [];
    let mouse = { x: null, y: null };

    const isDark = mode === 'dark';

    const CONNECTION_DISTANCE = 160;

    const DARK_COLORS = [
      { r: 6, g: 182, b: 212 },
      { r: 168, g: 85, b: 247 },
      { r: 59, g: 130, b: 246 },
    ];
    const LIGHT_COLORS = [
      { r: 59, g: 130, b: 246 },
      { r: 14, g: 165, b: 233 },
      { r: 20, g: 184, b: 166 },
    ];
    const COLORS = isDark ? DARK_COLORS : LIGHT_COLORS;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * (isDark ? 0.4 : 0.3);
        this.vy = (Math.random() - 0.5) * (isDark ? 0.4 : 0.3);
        this.baseRadius = isDark
          ? Math.random() * 2 + 1.2
          : Math.random() * 2.5 + 1.2;
        this.radius = this.baseRadius;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.pulseSpeed = 0.012 + Math.random() * 0.012;
        this.depth = Math.random() * 0.5 + 0.5;
      }

      update() {
        this.pulsePhase += this.pulseSpeed;
        this.radius = this.baseRadius + Math.sin(this.pulsePhase) * 0.6;
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw(ox, oy) {
        const dx = this.x + ox * this.depth;
        const dy = this.y + oy * this.depth;
        const { r, g, b } = this.color;
        const alpha = isDark ? 0.8 : 0.55;

        ctx.beginPath();
        ctx.arc(dx, dy, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;

        if (isDark) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(${r},${g},${b},0.5)`;
        } else {
          ctx.shadowBlur = 8;
          ctx.shadowColor = `rgba(${r},${g},${b},0.3)`;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const initParticles = () => {
      particles = [];
      const area = canvas.width * canvas.height;
      const count = Math.min(Math.max(Math.floor(area / 16000), 30), 100);
      for (let i = 0; i < count; i++) particles.push(new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let ox = 0, oy = 0;
      if (mouse.x !== null) {
        ox = (canvas.width / 2 - mouse.x) * 0.03;
        oy = (canvas.height / 2 - mouse.y) * 0.03;
      }

      for (const p of particles) p.update();

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        const ax = a.x + ox * a.depth;
        const ay = a.y + oy * a.depth;

        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const bx = b.x + ox * b.depth;
          const by = b.y + oy * b.depth;
          const dist = Math.hypot(ax - bx, ay - by);

          if (dist < CONNECTION_DISTANCE) {
            const fade = 1 - dist / CONNECTION_DISTANCE;
            const lineAlpha = isDark
              ? Math.min(fade * 0.2, 0.4)
              : Math.min(fade * 0.18, 0.3);

            const grad = ctx.createLinearGradient(ax, ay, bx, by);
            grad.addColorStop(0, `rgba(${a.color.r},${a.color.g},${a.color.b},${lineAlpha})`);
            grad.addColorStop(1, `rgba(${b.color.r},${b.color.g},${b.color.b},${lineAlpha})`);

            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = grad;
            ctx.lineWidth = isDark ? 1 : 0.7;
            ctx.stroke();
          }
        }
      }

      for (const p of particles) p.draw(ox, oy);
      animationFrameId = requestAnimationFrame(animate);
    };

    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onLeave = () => { mouse.x = null; mouse.y = null; };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);

    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
