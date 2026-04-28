import React, { useMemo, useState } from 'react';
import { Box, GizmoHelper, GizmoViewport, Text } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/appStore';
import { Furniture, FurnitureType, Room, Wall } from '../../types';

interface Scene3DProps {
  viewMode: 'orbit' | 'fps' | 'placement';
}

const sampleRoom: Room = {
  id: 'room-001',
  type: 'living_room',
  name: '客厅',
  dimensions: { width: 9.6, depth: 7.2, height: 3.1 },
  walls: [
    { id: 'wall-001', startPoint: { x: 0, y: 0, z: 0 }, endPoint: { x: 9.6, y: 0, z: 0 }, height: 3.1, thickness: 0.2, hasDoor: false, hasWindow: false },
    { id: 'wall-002', startPoint: { x: 9.6, y: 0, z: 0 }, endPoint: { x: 9.6, y: 0, z: 7.2 }, height: 3.1, thickness: 0.2, hasDoor: true, hasWindow: false },
    { id: 'wall-003', startPoint: { x: 9.6, y: 0, z: 7.2 }, endPoint: { x: 0, y: 0, z: 7.2 }, height: 3.1, thickness: 0.2, hasDoor: false, hasWindow: true },
    { id: 'wall-004', startPoint: { x: 0, y: 0, z: 7.2 }, endPoint: { x: 0, y: 0, z: 0 }, height: 3.1, thickness: 0.2, hasDoor: false, hasWindow: false },
  ],
  floor: { material: 'wood', color: '#8B4513' },
  ceiling: { material: 'white', color: '#FFFFFF' },
};

const WallMesh: React.FC<{ wall: Wall }> = ({ wall }) => {
  const start = new THREE.Vector3(wall.startPoint.x, wall.startPoint.y, wall.startPoint.z);
  const end = new THREE.Vector3(wall.endPoint.x, wall.endPoint.y, wall.endPoint.z);
  const direction = end.clone().sub(start).normalize();
  const length = start.distanceTo(end);
  const midPoint = start.clone().add(end).multiplyScalar(0.5);
  const angle = Math.atan2(direction.x, direction.z);

  return (
    <mesh position={[midPoint.x, wall.height / 2, midPoint.z]} rotation={[0, -angle, 0]} receiveShadow castShadow>
      <boxGeometry args={[wall.thickness, wall.height, length]} />
      <meshStandardMaterial color={wall.hasWindow ? '#87CEEB' : '#E8E8E8'} roughness={0.7} metalness={0.1} />
    </mesh>
  );
};

const FloorMesh: React.FC<{ room: Room; onClick?: (e: ThreeEvent<MouseEvent>) => void }> = ({ room, onClick }) => (
  <mesh position={[room.dimensions.width / 2, 0, room.dimensions.depth / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow onClick={onClick}>
    <planeGeometry args={[room.dimensions.width, room.dimensions.depth]} />
    <meshStandardMaterial color={room.floor?.color || '#8B4513'} roughness={0.8} metalness={0.1} />
  </mesh>
);

const CeilingMesh: React.FC<{ room: Room }> = ({ room }) => (
  <mesh position={[room.dimensions.width / 2, room.dimensions.height, room.dimensions.depth / 2]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
    <planeGeometry args={[room.dimensions.width, room.dimensions.depth]} />
    <meshStandardMaterial color={room.ceiling?.color || '#FFFFFF'} roughness={0.9} metalness={0} />
  </mesh>
);

const colorMap: Record<FurnitureType, string> = {
  sofa: '#6B4226', chair: '#4A4A4A', table: '#8B4513', cabinet: '#5D4037', bed: '#8D6E63', tv: '#212121', light: '#FFD700', rug: '#D2B48C', plant: '#2E7D32',
};

const FurnitureMesh: React.FC<{ furniture: Furniture; isSelected: boolean; movable: boolean; onSelect: () => void; onMove: (position: { x: number; y: number; z: number }) => void; }> = ({ furniture, isSelected, movable, onSelect, onMove }) => {
  const [hovered, setHovered] = useState(false);
  const meshScale = useMemo<[number, number, number]>(() => [
    furniture.dimensions.width * furniture.scale.x,
    furniture.dimensions.height * furniture.scale.y,
    furniture.dimensions.depth * furniture.scale.z,
  ], [furniture]);

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!movable) return;
    e.stopPropagation();
    onMove({ x: e.point.x, y: 0, z: e.point.z });
  };

  return (
    <group
      position={[furniture.position.x, (furniture.dimensions.height * furniture.scale.y) / 2, furniture.position.z]}
      rotation={[furniture.rotation.x, furniture.rotation.y, furniture.rotation.z]}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={handleDoubleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Box args={meshScale} receiveShadow castShadow>
        <meshStandardMaterial color={isSelected ? '#FF6B6B' : hovered ? '#FFA07A' : colorMap[furniture.type]} roughness={0.7} metalness={0.1} />
      </Box>
      <Text position={[0, meshScale[1] / 2 + 0.3, 0]} fontSize={0.15} color="#fff" anchorX="center" anchorY="middle">
        {furniture.name}
      </Text>
      {isSelected && (
        <Box args={[meshScale[0] + 0.1, meshScale[1] + 0.1, meshScale[2] + 0.1]}>
          <meshBasicMaterial color="#FF6B6B" wireframe />
        </Box>
      )}
    </group>
  );
};

export const Scene3D: React.FC<Scene3DProps> = ({ viewMode }) => {
  const { currentProject, selectedFurniture, setSelectedFurniture, moveFurniture, setFpsMoveTarget, setPlacementValidation } = useAppStore();
  const room = currentProject?.rooms[0] || sampleRoom;
  const furnitureList = currentProject?.furniture || [];

  const handleCanvasClick = () => {
    if (viewMode !== 'placement') setSelectedFurniture(null);
    setPlacementValidation(null);
  };

  const handleFloorPlacement = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();

    if (viewMode === 'placement' && selectedFurniture) {
      moveFurniture(selectedFurniture.id, { x: e.point.x, y: 0, z: e.point.z });
      return;
    }

    if (viewMode === 'fps') {
      setFpsMoveTarget({ x: e.point.x, y: 1.6, z: e.point.z });
    }
  };

  return (
    <>
      <group onClick={handleCanvasClick}>
        <FloorMesh room={room} onClick={handleFloorPlacement} />
        <CeilingMesh room={room} />
        {room.walls.map((wall) => <WallMesh key={wall.id} wall={wall} />)}
        {furnitureList.map((furniture) => (
          <FurnitureMesh
            key={furniture.id}
            furniture={furniture}
            isSelected={selectedFurniture?.id === furniture.id}
            movable={viewMode === 'placement'}
            onSelect={() => setSelectedFurniture(furniture)}
            onMove={(position) => moveFurniture(furniture.id, position)}
          />
        ))}
        <pointLight position={[room.dimensions.width / 2, room.dimensions.height - 0.3, room.dimensions.depth / 2]} intensity={1} color="#FFD700" distance={12} />
      </group>
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['#FF6B6B', '#4ECB71', '#3B82F6']} labelColor="white" />
      </GizmoHelper>
    </>
  );
};
