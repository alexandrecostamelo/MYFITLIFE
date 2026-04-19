'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { MuscleKey, MuscleActivation } from '@myfitlife/core/muscles';

interface Props {
  activation?: MuscleActivation;
  highlightMuscle?: MuscleKey | null;
  onMuscleClick?: (muscle: MuscleKey) => void;
}

const COLOR_REST = new THREE.Color(0x4a5568);
const COLOR_LOW = new THREE.Color(0x3b82f6);
const COLOR_MED = new THREE.Color(0xf59e0b);
const COLOR_HIGH = new THREE.Color(0xef4444);

function activationColor(t: number): THREE.Color {
  if (t <= 0) return COLOR_REST.clone();
  if (t < 0.5) return COLOR_LOW.clone().lerp(COLOR_MED, t * 2);
  return COLOR_MED.clone().lerp(COLOR_HIGH, (t - 0.5) * 2);
}

export function MuscleBody3D({ activation = {}, highlightMuscle, onMuscleClick }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rafRef = useRef<number>(0);
  const meshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleKey | null>(null);

  // drag state
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const spherical = useRef({ theta: 0, phi: Math.PI / 2 });
  const zoom = useRef(3.5);

  useEffect(() => {
    if (!mountRef.current) return;
    const el: HTMLDivElement = mountRef.current;

    const w = el.clientWidth;
    const h = el.clientHeight || 480;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    camera.position.set(0, 0, zoom.current);
    cameraRef.current = camera;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(2, 4, 3);
    scene.add(dir);
    const back = new THREE.DirectionalLight(0xffffff, 0.3);
    back.position.set(-2, -2, -3);
    scene.add(back);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Body group (rotates with drag)
    const body = new THREE.Group();
    scene.add(body);

    const meshes = meshesRef.current;
    meshes.clear();

    function addMesh(key: string, geo: THREE.BufferGeometry, pos: [number, number, number], rot?: [number, number, number]) {
      const mat = new THREE.MeshPhongMaterial({ color: COLOR_REST.clone(), shininess: 30 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...pos);
      if (rot) mesh.rotation.set(...rot);
      const baseKey = key.replace(/_r$/, '');
      mesh.userData.muscleKey = baseKey;
      body.add(mesh);
      meshes.set(key, mesh);
    }

    // — HEAD —
    addMesh('head', new THREE.SphereGeometry(0.12, 16, 16), [0, 0.9, 0]);

    // — NECK —
    addMesh('traps', new THREE.CylinderGeometry(0.06, 0.08, 0.12, 12), [0, 0.74, 0]);
    addMesh('traps_r', new THREE.CylinderGeometry(0.06, 0.08, 0.12, 12), [0, 0.74, 0]);

    // — TORSO / CHEST —
    addMesh('chest', new THREE.BoxGeometry(0.38, 0.25, 0.15), [0, 0.55, 0.04]);
    // shoulders front
    addMesh('shoulders_front', new THREE.SphereGeometry(0.07, 12, 12), [-0.23, 0.62, 0.04]);
    addMesh('shoulders_front_r', new THREE.SphereGeometry(0.07, 12, 12), [0.23, 0.62, 0.04]);
    // shoulders side
    addMesh('shoulders_side', new THREE.SphereGeometry(0.065, 12, 12), [-0.27, 0.60, 0]);
    addMesh('shoulders_side_r', new THREE.SphereGeometry(0.065, 12, 12), [0.27, 0.60, 0]);
    // shoulders rear
    addMesh('shoulders_rear', new THREE.SphereGeometry(0.065, 12, 12), [-0.22, 0.60, -0.1]);
    addMesh('shoulders_rear_r', new THREE.SphereGeometry(0.065, 12, 12), [0.22, 0.60, -0.1]);

    // — BACK —
    addMesh('lats', new THREE.BoxGeometry(0.16, 0.28, 0.10), [-0.16, 0.48, -0.07]);
    addMesh('lats_r', new THREE.BoxGeometry(0.16, 0.28, 0.10), [0.16, 0.48, -0.07]);
    addMesh('traps_upper', new THREE.BoxGeometry(0.30, 0.12, 0.08), [0, 0.63, -0.08]);
    addMesh('lower_back', new THREE.BoxGeometry(0.22, 0.14, 0.10), [0, 0.34, -0.07]);

    // — ABS —
    addMesh('abs', new THREE.BoxGeometry(0.20, 0.22, 0.10), [0, 0.44, 0.07]);
    addMesh('obliques', new THREE.BoxGeometry(0.07, 0.18, 0.09), [-0.14, 0.43, 0.03]);
    addMesh('obliques_r', new THREE.BoxGeometry(0.07, 0.18, 0.09), [0.14, 0.43, 0.03]);

    // — ARMS (left) —
    addMesh('biceps', new THREE.CylinderGeometry(0.045, 0.05, 0.22, 12), [-0.32, 0.45, 0.02], [0, 0, 0.15]);
    addMesh('triceps', new THREE.CylinderGeometry(0.04, 0.05, 0.22, 12), [-0.33, 0.45, -0.04], [0, 0, 0.15]);
    addMesh('forearms', new THREE.CylinderGeometry(0.035, 0.04, 0.20, 12), [-0.38, 0.24, 0], [0, 0, 0.2]);

    // — ARMS (right) —
    addMesh('biceps_r', new THREE.CylinderGeometry(0.045, 0.05, 0.22, 12), [0.32, 0.45, 0.02], [0, 0, -0.15]);
    addMesh('triceps_r', new THREE.CylinderGeometry(0.04, 0.05, 0.22, 12), [0.33, 0.45, -0.04], [0, 0, -0.15]);
    addMesh('forearms_r', new THREE.CylinderGeometry(0.035, 0.04, 0.20, 12), [0.38, 0.24, 0], [0, 0, -0.2]);

    // — GLUTES / HIP —
    addMesh('glutes', new THREE.SphereGeometry(0.12, 12, 12), [-0.08, 0.18, -0.06]);
    addMesh('glutes_r', new THREE.SphereGeometry(0.12, 12, 12), [0.08, 0.18, -0.06]);

    // — LEGS (left) —
    addMesh('quads', new THREE.CylinderGeometry(0.065, 0.055, 0.28, 12), [-0.09, -0.04, 0.03]);
    addMesh('hamstrings', new THREE.CylinderGeometry(0.06, 0.05, 0.26, 12), [-0.09, -0.03, -0.05]);
    addMesh('adductors', new THREE.CylinderGeometry(0.045, 0.04, 0.22, 12), [-0.05, -0.02, 0]);
    addMesh('calves', new THREE.CylinderGeometry(0.04, 0.035, 0.22, 12), [-0.09, -0.35, 0]);

    // — LEGS (right) —
    addMesh('quads_r', new THREE.CylinderGeometry(0.065, 0.055, 0.28, 12), [0.09, -0.04, 0.03]);
    addMesh('hamstrings_r', new THREE.CylinderGeometry(0.06, 0.05, 0.26, 12), [0.09, -0.03, -0.05]);
    addMesh('adductors_r', new THREE.CylinderGeometry(0.045, 0.04, 0.22, 12), [0.05, -0.02, 0]);
    addMesh('calves_r', new THREE.CylinderGeometry(0.04, 0.035, 0.22, 12), [0.09, -0.35, 0]);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    function getRelativeMouse(e: MouseEvent | Touch) {
      const rect = el.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
        y: -((e.clientY - rect.top) / rect.height) * 2 + 1,
      };
    }

    function updateCamera() {
      const r = zoom.current;
      const phi = Math.max(0.3, Math.min(Math.PI - 0.3, spherical.current.phi));
      camera.position.set(
        r * Math.sin(phi) * Math.sin(spherical.current.theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.cos(spherical.current.theta),
      );
      camera.lookAt(0, 0.3, 0);
    }

    // Mouse events
    const onMouseDown = (e: MouseEvent) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const onMouseUp = () => { isDragging.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        const dx = e.clientX - lastMouse.current.x;
        const dy = e.clientY - lastMouse.current.y;
        spherical.current.theta -= dx * 0.01;
        spherical.current.phi += dy * 0.01;
        lastMouse.current = { x: e.clientX, y: e.clientY };
        updateCamera();
      }
      const m = getRelativeMouse(e);
      mouse.set(m.x, m.y);
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom.current = Math.max(2, Math.min(6, zoom.current + e.deltaY * 0.003));
      updateCamera();
    };

    // Touch
    let lastTouchDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { isDragging.current = true; lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }
      if (e.touches.length === 2) { lastTouchDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1 && isDragging.current) {
        const dx = e.touches[0].clientX - lastMouse.current.x;
        const dy = e.touches[0].clientY - lastMouse.current.y;
        spherical.current.theta -= dx * 0.01;
        spherical.current.phi += dy * 0.01;
        lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        updateCamera();
      }
      if (e.touches.length === 2) {
        const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        zoom.current = Math.max(2, Math.min(6, zoom.current - (dist - lastTouchDist) * 0.01));
        lastTouchDist = dist;
        updateCamera();
      }
    };
    const onTouchEnd = () => { isDragging.current = false; };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);

    // Click
    const onClick = (e: MouseEvent) => {
      if (isDragging.current) return;
      const m = getRelativeMouse(e);
      raycaster.setFromCamera(new THREE.Vector2(m.x, m.y), camera);
      const hits = raycaster.intersectObjects(body.children);
      if (hits.length > 0) {
        const key = hits[0].object.userData.muscleKey as MuscleKey;
        onMuscleClick?.(key);
      }
    };
    el.addEventListener('click', onClick);

    updateCamera();

    // Animate
    function animate() {
      rafRef.current = requestAnimationFrame(animate);

      // Update colors
      meshes.forEach((mesh, meshKey) => {
        const baseKey = meshKey.replace(/_r$/, '').replace(/_upper$/, '') as MuscleKey;
        const act = activation[baseKey] ?? 0;
        const isHighlight = highlightMuscle === baseKey;
        const isHovered = hoveredMuscle === baseKey;
        const mat = mesh.material as THREE.MeshPhongMaterial;

        if (isHighlight || isHovered) {
          mat.color.set(0xffffff);
          mat.emissive.set(0x333300);
        } else {
          mat.color.copy(activationColor(act));
          mat.emissive.set(0x000000);
        }
      });

      // Hover detection
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(body.children);
      if (hits.length > 0) {
        const key = (hits[0].object.userData.muscleKey as string).replace(/_r$/, '') as MuscleKey;
        setHoveredMuscle(key);
      } else {
        setHoveredMuscle(null);
      }

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const ro = new ResizeObserver(() => {
      const nw = el.clientWidth;
      const nh = el.clientHeight || 480;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('click', onClick);
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update activation colors on prop change (via ref in animate loop)
  // We re-run the color logic in the animate loop using latest activation
  // so we patch through a ref trick — update scene meshes directly
  useEffect(() => {
    meshesRef.current.forEach((mesh, meshKey) => {
      const baseKey = meshKey.replace(/_r$/, '').replace(/_upper$/, '') as MuscleKey;
      const act = activation[baseKey] ?? 0;
      const mat = mesh.material as THREE.MeshPhongMaterial;
      if (highlightMuscle !== baseKey) {
        mat.color.copy(activationColor(act));
        mat.emissive.set(0x000000);
      }
    });
  }, [activation, highlightMuscle]);

  return (
    <div className="relative">
      <div ref={mountRef} style={{ width: '100%', height: 480, cursor: 'grab', touchAction: 'none' }} />
      {hoveredMuscle && (
        <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded bg-black/70 px-3 py-1 text-sm text-white">
          {hoveredMuscle.replace(/_/g, ' ')}
          {(activation[hoveredMuscle] ?? 0) > 0 && (
            <span className="ml-2 text-amber-400">{Math.round((activation[hoveredMuscle] ?? 0) * 100)}%</span>
          )}
        </div>
      )}
      <p className="mt-1 text-center text-xs text-muted-foreground">Arraste para girar · scroll para zoom</p>
    </div>
  );
}
