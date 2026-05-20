"use client";

import { useEffect, useRef } from "react";

export default function GlobalEyeBackground() {
  const eyeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;

      // Center of the screen for global viewport positioning
      const eyeX = window.innerWidth / 2;
      const eyeY = window.innerHeight / 2;

      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const maxTilt = 45;

      const dx = (mouseX - eyeX) / window.innerWidth;
      const dy = (mouseY - eyeY) / window.innerHeight;

      const clampedDx = Math.max(-1, Math.min(1, dx));
      const clampedDy = Math.max(-1, Math.min(1, dy));

      const tiltX = -clampedDy * maxTilt;
      const tiltY = clampedDx * maxTilt;

      eyeRef.current.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div ref={eyeRef} className="global-eye-container">
      <img 
        src="/eye.png" 
        alt="Universal Background" 
        className="eyeball-img"
        draggable="false"
      />
    </div>
  );
}
