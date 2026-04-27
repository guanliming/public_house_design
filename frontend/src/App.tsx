import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Sky, Environment, Grid, useProgress } from '@react-three/drei';
import * as THREE from 'three';

import { useAppStore } from './store/appStore';
import { Scene3D } from './components/3D/Scene3D';
import { Sidebar } from './components/ui/Sidebar';
import { Toolbar } from './components/ui/Toolbar';
import { StatusBar } from './components/ui/StatusBar';
import { HelpPanel } from './components/ui/HelpPanel';

type ViewMode = 'orbit' | 'fps' | 'placement';

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

const CameraModeController: React.FC<{ viewMode: ViewMode; target: THREE.Vector3 }> = ({ viewMode, target }) => {
  const { camera } = useThree();
  const { setCameraPosition } = useAppStore();
  const lastMode = useRef<ViewMode | null>(null);

  useEffect(() => {
    if (lastMode.current === viewMode) return;
    lastMode.current = viewMode;

    if (viewMode === 'fps') {
      camera.position.set(0.9, 1.6, 0.9);
      camera.lookAt(target.x, 1.6, target.z);
    } else {
      camera.position.set(14, 10, 14);
      camera.lookAt(target);
    }

    setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
  }, [camera, setCameraPosition, target, viewMode]);

  return null;
};

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('orbit');
  const [canvasError, setCanvasError] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
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
        {viewMode === 'fps' && <div className="mode-indicator">第一视角：可缓慢环视，暂不开放漫游</div>}
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

                <CameraModeController viewMode={viewMode} target={orbitTarget} />
                <Scene3D viewMode={viewMode} />
                <OrbitControls
                  makeDefault
                  enabled={viewMode !== 'placement'}
                  enablePan={viewMode !== 'fps'}
                  enableZoom={viewMode !== 'fps'}
                  rotateSpeed={viewMode === 'fps' ? 0.35 : 1}
                  minDistance={viewMode === 'fps' ? 0.01 : 1}
                  maxDistance={viewMode === 'fps' ? 0.01 : 50}
                  target={viewMode === 'fps' ? new THREE.Vector3(4.8, 1.6, 3.6) : orbitTarget}
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
