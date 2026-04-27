import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/appStore';

interface FPSControllerProps {
  moveSpeed?: number;
  turnSpeed?: number;
  initialPosition?: [number, number, number];
}

export const FPSController: React.FC<FPSControllerProps> = ({
  moveSpeed = 3,
  turnSpeed = 1.8,
  initialPosition = [0.8, 1.6, 0.8],
}) => {
  const { camera } = useThree();
  const { currentProject, setCameraPosition } = useAppStore();
  const keysPressed = useRef<Set<string>>(new Set());
  const yaw = useRef(Math.PI / 4);
  const lastCameraSync = useRef(0);
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());

  useEffect(() => {
    camera.position.set(...initialPosition);
    camera.rotation.set(0, yaw.current, 0, 'YXZ');
    setCameraPosition({ x: initialPosition[0], y: initialPosition[1], z: initialPosition[2] });
  }, [camera, initialPosition, setCameraPosition]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
        keysPressed.current.add(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      keysPressed.current.clear();
    };
  }, []);

  useFrame((state, delta) => {
    const room = currentProject?.rooms[0];
    const safeDelta = Math.min(delta, 0.05);
    const turnLeft = keysPressed.current.has('KeyQ') || keysPressed.current.has('ArrowLeft');
    const turnRight = keysPressed.current.has('KeyE') || keysPressed.current.has('ArrowRight');

    if (turnLeft) yaw.current += turnSpeed * safeDelta;
    if (turnRight) yaw.current -= turnSpeed * safeDelta;
    camera.rotation.set(0, yaw.current, 0, 'YXZ');

    const moveForward = Number(keysPressed.current.has('KeyW') || keysPressed.current.has('ArrowUp')) - Number(keysPressed.current.has('KeyS') || keysPressed.current.has('ArrowDown'));
    const moveRight = Number(keysPressed.current.has('KeyD')) - Number(keysPressed.current.has('KeyA'));

    if (moveForward !== 0 || moveRight !== 0) {
      forward.current.set(Math.sin(yaw.current), 0, Math.cos(yaw.current)).normalize();
      right.current.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current)).normalize();
      camera.position.addScaledVector(forward.current, moveForward * moveSpeed * safeDelta);
      camera.position.addScaledVector(right.current, moveRight * moveSpeed * safeDelta);
    }

    camera.position.y = 1.6;

    if (room) {
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, 0.35, room.dimensions.width - 0.35);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, 0.35, room.dimensions.depth - 0.35);
    }

    if (state.clock.elapsedTime - lastCameraSync.current > 0.2) {
      lastCameraSync.current = state.clock.elapsedTime;
      setCameraPosition({ x: camera.position.x, y: camera.position.y, z: camera.position.z });
    }
  });

  return null;
};
