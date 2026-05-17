"use client";

import { useEffect } from "react";
import LightRays from "@/components/react-bits/LightRays";

export default function HomeBackground({ trailImages }: { trailImages?: string[] }) {
  useEffect(() => {
    if (!trailImages || trailImages.length === 0) return;

    let lastX = 0;
    let lastY = 0;
    let currentImageIndex = 0;
    const distanceThreshold = 60;
    const trailElements: HTMLElement[] = [];
    const maxTrail = 5;
    let rafId: number | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      const distance = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      
      if (distance > distanceThreshold) {
        lastX = e.clientX;
        lastY = e.clientY;

        const x = e.clientX - 25;
        const y = e.clientY - 25;
        const imgSrc = trailImages[currentImageIndex];
        currentImageIndex = (currentImageIndex + 1) % trailImages.length;

        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
          const img = document.createElement("img");
          img.src = imgSrc;
          img.className = "mouse-trail-img";
          
          // GPU-accelerated coordinate translate3d setup
          img.setAttribute("data-x", String(x));
          img.setAttribute("data-y", String(y));
          img.style.position = "fixed";
          img.style.left = "0";
          img.style.top = "0";
          img.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          img.style.willChange = "transform, opacity";
          img.style.zIndex = "1"; // Above grid, below content
          
          document.body.appendChild(img);
          trailElements.push(img);

          // Trigger transition without synchronous layout thrashing
          requestAnimationFrame(() => {
            img.classList.add("active");
          });

          // Smoothly scale down and fade historical trail elements
          trailElements.forEach((el, index) => {
            const pos = trailElements.length - 1 - index;
            const scale = 1 - (pos * 0.2);
            const opacity = 1 - (pos * 0.3);
            const tx = el.getAttribute("data-x");
            const ty = el.getAttribute("data-y");
            el.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${Math.max(0.3, scale)})`;
            el.style.opacity = `${Math.max(0, opacity)}`;
          });

          if (trailElements.length > maxTrail) {
            const oldest = trailElements.shift();
            if (oldest) {
              oldest.classList.remove("active");
              oldest.classList.add("exit");
              setTimeout(() => oldest.remove(), 400);
            }
          }

          setTimeout(() => {
            if (trailElements.includes(img)) {
              const idx = trailElements.indexOf(img);
              if (idx > -1) trailElements.splice(idx, 1);
              img.classList.remove("active");
              img.classList.add("exit");
              setTimeout(() => img.remove(), 400);
            }
          }, 600);
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
      trailElements.forEach(el => el.remove());
    };
  }, [trailImages]);

  return (
    <div className="home-global-bg" style={{ overflow: 'hidden' }}>
      {/* Premium LightRays Background Canvas */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, opacity: 0.6, pointerEvents: 'none' }}>
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1}
          lightSpread={0.5}
          rayLength={3}
          followMouse={true}
          mouseInfluence={0.1}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>

      <div className="hero-bg"></div>
      <div className="hero-grid"></div>
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <div className="orb orb3"></div>
      <div className="orb orb4"></div>
      
      {/* Pre-fetch images */}
      {trailImages && (
        <div style={{ display: 'none' }}>
          {trailImages.map((src, i) => (
            <img key={i} src={src} alt="" />
          ))}
        </div>
      )}
    </div>
  );
}
