export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface RoomDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface Wall {
  id: string;
  startPoint: Vector3;
  endPoint: Vector3;
  height: number;
  thickness: number;
  hasDoor: boolean;
  hasWindow: boolean;
}

export interface Room {
  id: string;
  type: RoomType;
  name: string;
  origin: Vector3;
  dimensions: RoomDimensions;
  walls: Wall[];
  floor?: FloorMaterial;
  ceiling?: CeilingMaterial;
}

export type RoomType =
  | 'living_room'
  | 'bedroom'
  | 'kitchen'
  | 'bathroom'
  | 'dining_room'
  | 'office'
  | 'balcony'
  | 'corridor';

export interface FloorMaterial {
  material: string;
  color: string;
  textureUrl?: string;
}

export interface CeilingMaterial {
  material: string;
  color: string;
}

export type FurnitureType =
  | 'sofa'
  | 'chair'
  | 'table'
  | 'cabinet'
  | 'bed'
  | 'tv'
  | 'light'
  | 'rug'
  | 'plant';

export interface Furniture {
  id: string;
  roomId: string;
  type: FurnitureType;
  name: string;
  modelUrl: string;
  dimensions: RoomDimensions;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

export interface DesignProject {
  id: string;
  name: string;
  activeRoomId?: string;
  reconstructionTaskId?: string;
  rooms: Room[];
  furniture: Furniture[];
  materials: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

export type ReconstructionStatus =
  | 'pending'
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ReconstructionTask {
  taskId: string;
  status: ReconstructionStatus;
  imageCount: number;
  progress: number;
  rooms?: Room[];
  errorMessage?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PlacementValidation {
  valid: boolean;
  message?: string;
  overlapDistance?: number;
}

export interface RulerMeasurement {
  id: string;
  start: Vector3;
  end: Vector3;
  distance: number;
  unit: 'meters' | 'centimeters';
}
