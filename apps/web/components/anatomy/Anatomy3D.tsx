'use client';

import { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { MUSCLE_LABELS, type MuscleKey } from '@myfitlife/core/muscles';

interface Props {
  primaryMuscles: MuscleKey[];
  secondaryMuscles?: MuscleKey[];
  height?: number;
  autoRotate?: boolean;
  intensity?: Partial<Record<MuscleKey, number>>;
}

type MeshDef = {
  key: string;
  muscleKey: MuscleKey;
  geo: THREE.BufferGeometry;
  pos: [number, number, number];
  rot?: [number, number, number];
};

function buildMeshDefs(): MeshDef[] {
  const defs: MeshDef[] = [];

  function add(key: string, muscleKey: MuscleKey, geo: THREE.BufferGeometry, pos: [number, number, number], rot?: [number, number, number]) {
    defs.push({ key, muscleKey, geo, pos, rot });
  }

  // Chest
  add('chest', 'chest', new THREE.BoxGeometry(0.38, 0.25, 0.15), [0, 0.55, 0.04]);

  // Shoulders
  add('shoulders_front', 'shoulders_front', new THREE.SphereGeometry(0.07, 12, 12), [-0.23, 0.62, 0.04]);
  add('shoulders_front_r', 'shoulders_front', new THREE.SphereGeometry(0.07, 12, 12), [0.23, 0.62, 0.04]);
  add('shoulders_side', 'shoulders_side', new THREE.SphereGeometry(0.065, 12, 12), [-0.27, 0.60, 0]);
  add('shoulders_side_r', 'shoulders_side', new THREE.SphereGeometry(0.065, 12, 12), [0.27, 0.60, 0]);
  add('shoulders_rear', 'shoulders_rear', new THREE.SphereGeometry(0.065, 12, 12), [-0.22, 0.60, -0.1]);
  add('shoulders_rear_r', 'shoulders_rear', new THREE.SphereGeometry(0.065, 12, 12), [0.22, 0.60, -0.1]);

  // Back
  add('lats', 'lats', new THREE.BoxGeometry(0.16, 0.28, 0.10), [-0.16, 0.48, -0.07]);
  add('lats_r', 'lats', new THREE.BoxGeometry(0.16, 0.28, 0.10), [0.16, 0.48, -0.07]);
  add('traps', 'traps', new THREE.BoxGeometry(0.30, 0.12, 0.08), [0, 0.63, -0.08]);
  add('traps_neck', 'traps', new THREE.CylinderGeometry(0.06, 0.08, 0.12, 12), [0, 0.74, 0]);
  add('lower_back', 'lower_back', new THREE.BoxGeometry(0.22, 0.14, 0.10), [0, 0.34, -0.07]);

  // Arms
  add('biceps', 'biceps', new THREE.CylinderGeometry(0.045, 0.05, 0.22, 12), [-0.32, 0.45, 0.02], [0, 0, 0.15]);
  add('biceps_r', 'biceps', new THREE.CylinderGeometry(0.045, 0.05, 0.22, 12), [0.32, 0.45, 0.02], [0, 0, -0.15]);
  add('triceps', 'triceps', new THREE.CylinderGeometry(0.04, 0.05, 0.22, 12), [-0.33, 0.45, -0.04], [0, 0, 0.15]);
  add('triceps_r', 'triceps', new THREE.CylinderGeometry(0.04, 0.05, 0.22, 12), [0.33, 0.45, -0.04], [0, 0, -0.15]);
  add('forearms', 'forearms', new THREE.CylinderGeometry(0.035, 0.04, 0.20, 12), [-0.38, 0.24, 0], [0, 0, 0.2]);
  add('forearms_r', 'forearms', new THREE.CylinderGeometry(0.035, 0.04, 0.20, 12), [0.38, 0.24, 0], [0, 0, -0.2]);

  // Core
  add('abs', 'abs', new THREE.BoxGeometry(0.20, 0.22, 0.10), [0, 0.44, 0.07]);
  add('obliques', 'obliques', new THREE.BoxGeometry(0.07, 0.18, 0.09), [-0.14, 0.43, 0.03]);
  add('obliques_r', 'obliques', new THREE.BoxGeometry(0.07, 0.18, 0.09), [0.14, 0.43, 0.03]);

  // Glutes
  add('glutes', 'glutes', new THREE.SphereGeometry(0.12, 12, 12), [-0.08, 0.18, -0.06]);
  add('glutes_r', 'glutes', new THREE.SphereGeometry(0.12, 12, 12), [0.08, 0.18, -0.06]);

  // Legs
  add('quads', 'quads', new THREE.CylinderGeometry(0.065, 0.055, 0.28, 12), [-0.09, -0.04, 0.03]);
  add('quads_r', 'quads', new THREE.CylinderGeometry(0.065, 0.055, 0.28, 12), [0.09, -0.04, 0.03]);
  add('hamstrings', 'hamstrings', new THREE.CylinderGeometry(0.06, 0.05, 0.26, 12), [-0.09, -0.03, -0.05]);
  add('hamstrings_r', 'hamstrings', new THREE.CylinderGeometry(0.06, 0.05, 0.26, 12), [0.09, -0.03, -0.05]);
  add('adductors', 'adductors', new THREE.CylinderGeometry(0.045, 0.04, 0.22, 12), [-0.05, -0.02, 0]);
  add('adductors_r', 'adductors', new THREE.CylinderGeometry(0.045, 0.04, 0.22, 12), [0.05, -0.02, 0]);
  add('calves', 'calves', new THREE.CylinderGeometry(0.04, 0.035, 0.22, 12), [-0.09, -0.35, 0]);
  add('calves_r', 'calves', new THREE.CylinderGeometry(0.04, 0.035, 0.22, 12), [0.09, -0.35, 0]);

  return defs;
}

export function Anatomy3D({
  primaryMuscles,
  secondaryMuscles = [],
  height = 400,
  autoRotate = true,
  intensity,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const primarySet = useMemo(() => new Set(primaryMuscles), [primaryMuscles]);
  const secondarySet = useMemo(() => new Set(secondaryMuscles), [secondaryMuscles]);

  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const w = el.clientWidth;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, height);
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / height, 0.1, 100);
    camera.position.set(0, 0.3, 3.5);
    camera.lookAt(0, 0.3, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(3, 6, 4);
    scene.add(dir);
    const back = new THREE.DirectionalLight(0x8899cc, 0.3);
    back.position.set(-3, 3, -4);
    scene.add(back);

    const body = new THREE.Group();

    // Ghost body (transparent shell)
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xc8b8a8,
      roughness: 0.7,
      metalness: 0.05,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), skinMat);
    head.position.y = 0.9;
    body.add(head);

    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.55, 4, 16), skinMat);
    torso.position.y = 0.4;
    body.add(torso);

    const hip = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.15, 4, 16), skinMat);
    hip.position.y = 0.05;
    body.add(hip);

    const makeLimb = (r: number, len: number) => new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 12), skinMat);
    const addLimb = (r: number, len: number, pos: [number, number, number]) => {
      const mesh = makeLimb(r, len);
      mesh.position.set(...pos);
      body.add(mesh);
    };
    addLimb(0.07, 0.4, [-0.35, 0.38, 0]);
    addLimb(0.07, 0.4, [0.35, 0.38, 0]);
    addLimb(0.06, 0.35, [-0.42, 0.05, 0]);
    addLimb(0.06, 0.35, [0.42, 0.05, 0]);
    addLimb(0.1, 0.45, [-0.1, -0.3, 0]);
    addLimb(0.1, 0.45, [0.1, -0.3, 0]);
    addLimb(0.07, 0.4, [-0.1, -0.78, 0]);
    addLimb(0.07, 0.4, [0.1, -0.78, 0]);

    // Muscle meshes
    const meshDefs = buildMeshDefs();
    const muscleMeshes: Array<{ mesh: THREE.Mesh; muscleKey: MuscleKey }> = [];

    for (const def of meshDefs) {
      const mat = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.4,
        transparent: true,
        opacity: 0,
        emissive: new THREE.Color(0x000000),
        emissiveIntensity: 0,
      });
      const mesh = new THREE.Mesh(def.geo, mat);
      mesh.position.set(...def.pos);
      if (def.rot) mesh.rotation.set(...def.rot);
      body.add(mesh);
      muscleMeshes.push({ mesh, muscleKey: def.muscleKey });
    }

    scene.add(body);

    // Drag
    let dragging = false;
    const lastPtr = { x: 0, y: 0 };
    const spherical = { theta: 0, phi: Math.PI / 2 };
    let zoomVal = 3.5;

    function updateCamera() {
      const phi = Math.max(0.3, Math.min(Math.PI - 0.3, spherical.phi));
      camera.position.set(
        zoomVal * Math.sin(phi) * Math.sin(spherical.theta),
        zoomVal * Math.cos(phi),
        zoomVal * Math.sin(phi) * Math.cos(spherical.theta),
      );
      camera.lookAt(0, 0.3, 0);
    }

    const canvas = renderer.domElement;
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'grab';

    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastPtr.x = e.clientX;
      lastPtr.y = e.clientY;
      canvas.style.cursor = 'grabbing';
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      spherical.theta -= (e.clientX - lastPtr.x) * 0.01;
      spherical.phi += (e.clientY - lastPtr.y) * 0.01;
      lastPtr.x = e.clientX;
      lastPtr.y = e.clientY;
      updateCamera();
    };
    const onUp = () => {
      dragging = false;
      canvas.style.cursor = 'grab';
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomVal = Math.max(2, Math.min(6, zoomVal + e.deltaY * 0.003));
      updateCamera();
    };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Animate
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      if (autoRotate && !dragging) {
        spherical.theta += 0.004;
        updateCamera();
      }

      const t = performance.now() * 0.003;

      for (const { mesh, muscleKey } of muscleMeshes) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const isPrimary = primarySet.has(muscleKey);
        const isSecondary = !isPrimary && secondarySet.has(muscleKey);
        const intensityVal = intensity?.[muscleKey];

        if (isPrimary) {
          mat.color.set(0xef4444);
          mat.emissive.set(0xef4444);
          mat.emissiveIntensity = 0.3 + Math.sin(t) * 0.15;
          mat.opacity = 0.85 + Math.sin(t) * 0.1;
        } else if (isSecondary) {
          mat.color.set(0xf59e0b);
          mat.emissive.set(0xf59e0b);
          mat.emissiveIntensity = 0.2;
          mat.opacity = 0.7;
        } else if (intensityVal !== undefined && intensityVal > 0) {
          const v = Math.min(1, intensityVal);
          mat.color.setRGB(1, 0.8 - v * 0.5, 0.3 - v * 0.2);
          mat.emissive.setRGB(v * 0.4, v * 0.15, 0);
          mat.emissiveIntensity = 0.15 + v * 0.25;
          mat.opacity = 0.4 + v * 0.45;
        } else {
          mat.opacity = 0;
          mat.emissiveIntensity = 0;
        }
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = el.clientWidth;
      renderer.setSize(nw, height);
      camera.aspect = nw / height;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    cleanupRef.current = () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('wheel', onWheel);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      renderer.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    };

    return () => cleanupRef.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
