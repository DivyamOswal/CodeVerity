import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ScrollTrigger } from "../lib/gsap";

function getCSSColor(varName, fallbackHex) {
  if (typeof window === "undefined") return fallbackHex;
  const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return val || fallbackHex;
}

export default function ScrollReactiveBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    let renderer, scene, camera, particles, grid, frameId, st;
    let geo, mat, gridGeo, gridMat;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    let scrollProgress = 0;

    try {
      const accent = new THREE.Color(getCSSColor("--accent", "#22d3ee"));
      const accentSecondary = new THREE.Color(getCSSColor("--accent-secondary", "#818cf8"));

      const width = document.documentElement.clientWidth;
      const height = document.documentElement.clientHeight;

      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      renderer.setSize(width, height);
      renderer.setClearColor(0x000000, 0);

      scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x05070a, 0.012);

      camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 400);
      camera.position.set(0, 0, 60);

      /* -------- Particle field -------- */
      const count = isMobile ? 900 : 2200;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        positions[i3]     = (Math.random() - 0.5) * 160;
        positions[i3 + 1] = (Math.random() - 0.5) * 100;
        positions[i3 + 2] = (Math.random() - 0.5) * 400 - 100;

        const mixed = accent.clone().lerp(accentSecondary, Math.random());
        colors[i3]     = mixed.r;
        colors[i3 + 1] = mixed.g;
        colors[i3 + 2] = mixed.b;
      }

      geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      mat = new THREE.PointsMaterial({
        size: 0.7,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      particles = new THREE.Points(geo, mat);
      scene.add(particles);

      /* -------- Faint grid floor -------- */
      grid = new THREE.GridHelper(400, 60, accent, accentSecondary);
      grid.material.transparent = true;
      grid.material.opacity = 0.06;
      grid.position.y = -32;
      gridGeo = grid.geometry;
      gridMat = grid.material;
      scene.add(grid);

      /* -------- Scroll progress (ScrollSmoother-aware) -------- */
      st = ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => { scrollProgress = self.progress; },
      });

      /* -------- Handlers -------- */
      const handleResize = () => {
        const w = document.documentElement.clientWidth;
        const h = document.documentElement.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      const handleMouseMove = (e) => {
        mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
      };

      window.addEventListener("resize", handleResize);
      window.addEventListener("mousemove", handleMouseMove);

      /* -------- Render loop -------- */
      let time = 0;
      const render = () => {
        time += 0.005;

        mouse.x += (mouse.tx - mouse.x) * 0.05;
        mouse.y += (mouse.ty - mouse.y) * 0.05;

        // Camera flies through the field as the user scrolls
        camera.position.z = 60 - scrollProgress * 140;
        camera.position.x = mouse.x * 4;
        camera.position.y = -mouse.y * 3 + scrollProgress * 20;
        camera.lookAt(0, scrollProgress * 15, camera.position.z - 60);

        particles.rotation.y = time * 0.05 + scrollProgress * 0.5;
        particles.rotation.z = Math.sin(time * 0.2) * 0.03;

        if (grid) grid.position.y = -32 + scrollProgress * 40;

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(render);
      };

      if (reduceMotion) {
        renderer.render(scene, camera);
      } else {
        render();
      }

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("mousemove", handleMouseMove);
        st?.kill();
        geo?.dispose();
        mat?.dispose();
        gridGeo?.dispose();
        gridMat?.dispose();
        renderer?.dispose();
      };
    } catch (err) {
      console.error("ScrollReactiveBackground failed:", err);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}