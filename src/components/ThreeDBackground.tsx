import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../contexts/ThemeContext';

export function ThreeDBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const bgColor = theme === 'dark' ? 0x0f172a : 0xf8fafc;
    scene.background = new THREE.Color(bgColor);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const particleCount = 2000;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlesPositions[i] = (Math.random() - 0.5) * 200;
      particlesPositions[i + 1] = (Math.random() - 0.5) * 200;
      particlesPositions[i + 2] = (Math.random() - 0.5) * 200;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.5,
      color: theme === 'dark' ? 0x60a5fa : 0x3b82f6,
      transparent: true,
      opacity: 0.6,
    });

    const particles = new THREE.Points(particlesGeometry, particleMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    const lines = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: theme === 'dark' ? 0x1e40af : 0x1e3a8a,
        transparent: true,
        opacity: 0.2,
      })
    );
    scene.add(lines);

    const positions = particlesGeometry.getAttribute('position') as THREE.BufferAttribute;
    const linePositions: number[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);

      for (let j = i + 1; j < particleCount; j++) {
        const x2 = positions.getX(j);
        const y2 = positions.getY(j);
        const z2 = positions.getZ(j);

        const distance = Math.sqrt(
          Math.pow(x - x2, 2) + Math.pow(y - y2, 2) + Math.pow(z - z2, 2)
        );

        if (distance < 30) {
          linePositions.push(x, y, z, x2, y2, z2);
        }
      }
    }

    lines.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePositions), 3));

    let scrollY = 0;
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll);

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / width) * 2 - 1;
      mouseY = -(e.clientY / height) * 2 + 1;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (particles) {
        particles.rotation.x += 0.0001;
        particles.rotation.y += 0.0002;
        particles.position.y = scrollY * 0.01;
      }

      if (lines) {
        lines.rotation.x += 0.00005;
        lines.rotation.y += 0.0001;
        lines.position.y = scrollY * 0.01;
      }

      camera.position.x = mouseX * 5;
      camera.position.y = mouseY * 5;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      containerRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={containerRef}
      className="fixed top-0 left-0 w-full h-screen -z-10"
      style={{ overflow: 'hidden' }}
    />
  );
}
