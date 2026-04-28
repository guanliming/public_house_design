import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Sky, Environment, Grid, useProgress } from '@react-three/drei';
import * as THREE from 'three';

import { useAppStore } from './store/appStore';
import { Scene3D } from './components/3D/Scene3D';
import { Sidebar } from './components/ui/Sidebar';
import { Toolbar } from './components/ui/Toolbar';
import { StatusBar } from './components/ui/StatusBar';
import { HelpPanel } from './components/ui/HelpPanel';

type ViewMode = 'orbit' | 'fps' | 'placement';

type OrbitControlsRef = {
  target: THREE.Vector3;
  update: () => void;
};

const CanvasLoader: React.FC = () => {
  const { active, progress, item, loaded, total } = useProgress();

  return (
    <Html center>
      <div className="canvas-loader">
        <div className="canvas-loader-title">正在初始化 3D 场景</div>
        <div className="canvas-loader-subtitle">{active ? '正在加载资源…' : '正在准备渲染器…'}</div>
        <div className="canvas-loader-bar">
          <div className="canvas-loader-bar-fill" style={{ width: `${Math.max(progress, 8)}%` }} />
        </div>
        <div className="canvas-loader-progress">{Math.round(progress)}%</div>
        <div className="canvas-loader-meta">{total > 0 ? `资源 ${loaded}/${total}` : '首次启动可能需要几秒'}</div>
        {item && <div className="canvas-loader-item">当前资源：{item}</div>}
      </div>
    </Html>
  );
};

const CameraModeController: React.FC<{
  viewMode: ViewMode;
  orbitTarget: THREE.Vector3;
  controlsRef: React.MutableRefObject<OrbitControlsRef | null>;
}> = ({ viewMode, orbitTarget, controlsRef }) => {
  const { camera } = useThree();
  const { currentProject, setCameraPosition, fpsMoveTarget, setFpsMoveTarget } = useAppStore();
  const lastMode = useRef<ViewMode | null>(null);
  const lastCameraSync = useRef(0);
  const keysPressed = useRef<Set<string>>(new Set());
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (viewMode !== 'fps') return;

      const supportedKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!supportedKeys.includes(event.code)) return;

      event.preventDefault();
      keysPressed.current.add(event.code);
      setFpsMoveTarget(null);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.code);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysPressed.current.clear();
    };
  }, [setFpsMoveTarget, viewMode]);

  useEffect(() => {
    if (lastMode.current === viewMode) return;
    lastMode.current = viewMode;
    keysPressed.current.clear();

    if (viewMode === 'fps') {
      const fpsPosition = new THREE.Vector3(0.9, 1.6, 0.9);
      const fpsTarget = new THREE.Vector3(4.8, 1.6, 3.6);
      camera.position.copy(fpsPosition);
      camera.lookAt(fpsTarget);
      controlsRef.current?.target.copy(fpsTarget);
      controlsRef.current?.update();
    } else {
      camera.position.set(14, 10, 14);
      camera.lookAt(orbitTarget);
      controlsRef.current?.target.copy(orbitTarget);
      controlsRef.current?.update();
      setFpsMoveTarget(null);
    }

    setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
  }, [camera, controlsRef, orbitTarget, setCameraPosition, setFpsMoveTarget, viewMode]);

  useFrame((state, delta) => {
    if (viewMode !== 'fps') return;

    const safeDelta = Math.min(delta, 0.05);
    const room = currentProject?.rooms[0];
    const oldPosition = camera.position.clone();
    let nextPosition = oldPosition.clone();

    if (fpsMoveTarget) {
      const targetPos = new THREE.Vector3(fpsMoveTarget.x, 1.6, fpsMoveTarget.z);
      nextPosition = oldPosition.clone().lerp(targetPos, Math.min(1, safeDelta * 2.4));

      if (nextPosition.distanceTo(targetPos) < 0.08) {
        nextPosition.copy(targetPos);
        setFpsMoveTarget(null);
      }
    } else {
      const moveForward = Number(keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) - Number(keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown'));
      const moveRight = Number(keysPressed.current.has('KeyD') || keysPressed.current.has('KeyE') || keysPressed.current.has('ArrowRight')) - Number(keysPressed.current.has('KeyA') || keysPressed.current.has('KeyQ') || keysPressed.current.has('ArrowLeft'));

      if (moveForward !== 0 || moveRight !== 0) {
        camera.getWorldDirection(forward.current);
        forward.current.y = 0;
        forward.current.normalize();
        right.current.crossVectors(forward.current, camera.up).normalize();

        const move = new THREE.Vector3();
        move.addScaledVector(forward.current, moveForward);
        move.addScaledVector(right.current, moveRight);
        move.normalize().multiplyScalar(2.2 * safeDelta);
        nextPosition.add(move);
      }
    }

    nextPosition.y = 1.6;

    if (room) {
      nextPosition.x = THREE.MathUtils.clamp(nextPosition.x, 0.35, room.dimensions.width - 0.35);
      nextPosition.z = THREE.MathUtils.clamp(nextPosition.z, 0.35, room.dimensions.depth - 0.35);
    }

    const moveDelta = nextPosition.clone().sub(oldPosition);
    if (moveDelta.lengthSq() > 0.000001) {
      camera.position.copy(nextPosition);
      controlsRef.current?.target.add(moveDelta);
      controlsRef.current?.update();
    }

    if (state.clock.elapsedTime - lastCameraSync.current > 0.16) {
      lastCameraSync.current = state.clock.elapsedTime;
      setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
    }
  });

  return null;
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const controlsRef = useRef<OrbitControlsRef | null>(null);
  const { ensureDemoProject, setPlacementMode, placementValidation, currentProject, setCameraPosition } = useAppStore();

  useEffect(() => {
    ensureDemoProject();
  }, [ensureDemoProject]);

  useEffect(() => {
    setPlacementMode(viewMode === 'placement');
  }, [setPlacementMode, viewMode]);

  const room = currentProject?.rooms[0];
  const orbitTarget = useMemo(() => new THREE.Vector3(room ? room.dimensions.width / 2 : 4.8, 1.2, room ? room.dimensions.depth / 2 : 3.6), [room]);

  return (
    <div className="app-container">
      <Sidebar />

      <div className="viewport">
        <Toolbar currentMode={viewMode} onModeChange={setViewMode} />

        {viewMode === 'orbit' && <div className="mode-indicator">上帝视角：查看整体布局</div>}
        {viewMode === 'fps' && <div className="mode-indicator">第一视角：拖动环视，WASD/QE 移动</div>}
        {viewMode === 'placement' && <div className="mode-indicator">家具编辑：选中家具后点击地面移动</div>}

        <div className="canvas-container">
          {!canvasReady && !canvasError && (
            <div className="canvas-loader-overlay">
              <div className="canvas-loader">
                <div className="canvas-loader-title">正在启动 3D 视图</div>
                <div className="canvas-loader-subtitle">如果持续黑屏，通常不是网速慢，而是渲染初始化失败。</div>
                <div className="canvas-loader-bar">
                  <div className="canvas-loader-bar-fill indeterminate" />
                </div>
              </div>
            </div>
          )}

          {canvasError ? (
            <div className="canvas-error-overlay">
              <div className="canvas-error-card">
                <div className="canvas-error-title">3D 视图初始化失败</div>
                <div className="canvas-error-message">{canvasError}</div>
                <div className="canvas-error-hint">这通常和浏览器 WebGL、显卡驱动、远程桌面环境，或 Three.js 渲染上下文初始化有关，不是单纯加载慢。</div>
              </div>
            </div>
          ) : (
            <Canvas
              shadows
              camera={{ position: [14, 10, 14], fov: 50 }}
              gl={{ antialias: true, alpha: false }}
              onCreated={({ camera }) => {
                setCanvasReady(true);
                setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
              }}
              fallback={<div className="canvas-error-overlay">当前环境不支持 Canvas</div>}
            >
              <Suspense fallback={<CanvasLoader />}>
                <color attach="background" args={['#1a1a2e']} />
                <Sky sunPosition={[100, 20, 100]} inclination={0.5} azimuth={0.25} />
                <Environment preset="city" />
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1} castShadow shadow-mapSize={[2048, 2048]}>
                  <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
                </directionalLight>
                <pointLight position={[-10, 10, -10]} intensity={0.5} />
                <Grid
                  position={[0, -0.01, 0]}
                  args={[50, 50]}
                  cellSize={1}
                  cellThickness={0.5}
                  cellColor="#6b7280"
                  sectionSize={5}
                  sectionThickness={1}
                  sectionColor="#374151"
                  fadeDistance={50}
                  fadeStrength={1}
                  followCamera={false}
                  infiniteGrid
                />

                <CameraModeController viewMode={viewMode} orbitTarget={orbitTarget} controlsRef={controlsRef} />
                <Scene3D viewMode={viewMode} />
                <OrbitControls
                  ref={controlsRef}
                  makeDefault
                  enabled={viewMode !== 'placement'}
                  enablePan={viewMode !== 'fps'}
                  enableZoom={viewMode !== 'fps'}
                  rotateSpeed={viewMode === 'fps' ? 0.35 : 1}
                  minDistance={viewMode === 'fps' ? 0.01 : 1}
                  maxDistance={viewMode === 'fps' ? 0.01 : 50}
                  maxPolarAngle={viewMode === 'fps' ? Math.PI / 1.9 : Math.PI / 2}
                  minPolarAngle={viewMode === 'fps' ? Math.PI / 2.8 : 0}
                />
              </Suspense>
            </Canvas>
          )}
        </div>

        {placementValidation?.message && !placementValidation.valid && <div className="placement-warning">{placementValidation.message}</div>}

        <StatusBar viewMode={viewMode} />
        <HelpPanel viewMode={viewMode} />
      </div>
    </div>
  );
};

export default App;
