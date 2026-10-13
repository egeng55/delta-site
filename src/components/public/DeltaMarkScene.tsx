"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import styles from "./public-site.module.css";

function triangleShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 1.78);
  shape.lineTo(-1.62, -1.22);
  shape.lineTo(1.62, -1.22);
  shape.closePath();

  const aperture = new THREE.Path();
  aperture.moveTo(0, 0.79);
  aperture.lineTo(0.72, -0.57);
  aperture.lineTo(-0.72, -0.57);
  aperture.closePath();
  shape.holes.push(aperture);
  return shape;
}

export default function DeltaMarkScene() {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mount.current;
    if (!host) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const canvas = document.createElement("canvas");
    const contextAttributes: WebGLContextAttributes = {
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    };
    const context =
      canvas.getContext("webgl2", contextAttributes) ??
      canvas.getContext("webgl", contextAttributes);
    if (!context) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      context,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0, 7.2);

    const geometry = new THREE.ExtrudeGeometry(triangleShape(), {
      depth: 0.42,
      bevelEnabled: true,
      bevelSegments: 7,
      bevelSize: 0.09,
      bevelThickness: 0.09,
      curveSegments: 3,
    });
    geometry.center();

    const material = new THREE.MeshPhysicalMaterial({
      color: 0x7668ee,
      emissive: 0x17123d,
      emissiveIntensity: 0.45,
      metalness: 0.42,
      roughness: 0.24,
      clearcoat: 0.9,
      clearcoatRoughness: 0.19,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    const edgeGeometry = new THREE.EdgesGeometry(geometry, 18);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xd8efff,
      transparent: true,
      opacity: 0.42,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

    const mark = new THREE.Group();
    mark.add(mesh, edges);
    mark.rotation.set(-0.16, -0.4, -0.08);
    scene.add(mark);

    const violetLight = new THREE.PointLight(0x705cff, 34, 18);
    violetLight.position.set(-3.8, 2.8, 4.2);
    scene.add(violetLight);

    const iceLight = new THREE.PointLight(0xbde5ff, 28, 18);
    iceLight.position.set(4.2, -1.5, 4.8);
    scene.add(iceLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 2.4);
    rimLight.position.set(1, 4, 5);
    scene.add(rimLight);
    scene.add(new THREE.AmbientLight(0x8b9ccf, 0.58));

    const pointer = new THREE.Vector2();
    const pointerTarget = new THREE.Vector2();
    let frame = 0;
    let scrollProgress = 0;

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      mark.scale.setScalar(width < 720 ? 0.76 : 1);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerTarget.set(
        (event.clientX / window.innerWidth - 0.5) * 2,
        (event.clientY / window.innerHeight - 0.5) * 2,
      );
    };

    const onScroll = () => {
      scrollProgress = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1.2);
    };

    const render = (time = 0) => {
      pointer.lerp(pointerTarget, 0.045);
      if (!prefersReducedMotion) {
        mark.rotation.x = -0.16 - pointer.y * 0.09 + scrollProgress * 0.2;
        mark.rotation.y = -0.4 + pointer.x * 0.16 + scrollProgress * 0.48;
        mark.rotation.z = -0.08 + Math.sin(time * 0.00032) * 0.035;
        mark.position.y = Math.sin(time * 0.00048) * 0.075 - scrollProgress * 0.28;
      }
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(render);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    resize();
    onScroll();
    render();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      geometry.dispose();
      edgeGeometry.dispose();
      material.dispose();
      edgeMaterial.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return (
    <div ref={mount} className={styles.deltaMarkScene} aria-hidden="true">
      <span className={styles.deltaMarkFallback} />
    </div>
  );
}
