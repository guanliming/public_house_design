import { create } from 'zustand';
import * as THREE from 'three';
import { DesignProject, Furniture, PlacementValidation, ReconstructionTask, Room, RoomType, Vector3 } from '../types';

type NewRoomInput = { name: string; type: RoomType; width: number; depth: number; height: number; originX: number; originZ: number };

interface AppState {
  projects: DesignProject[];
  currentProject: DesignProject | null;
  reconstructionTasks: ReconstructionTask[];
  furnitureLibrary: Furniture[];
  selectedFurniture: Furniture | null;
  cameraPosition: Vector3;
  cameraRotation: Vector3;
  fpsMoveTarget: Vector3 | null;
  placementMode: boolean;
  placementValidation: PlacementValidation | null;
  setCurrentProject: (project: DesignProject | null) => void;
  addProject: (project: DesignProject) => void;
  updateProject: (projectId: string, updates: Partial<DesignProject>) => void;
  deleteProject: (projectId: string) => void;
  ensureDemoProject: () => void;
  setActiveRoom: (roomId: string) => void;
  addRoom: (input: NewRoomInput) => void;
  updateRoom: (roomId: string, input: NewRoomInput) => void;
  deleteRoom: (roomId: string) => void;
  addFurnitureToProject: (furniture: Furniture) => void;
  addFurnitureFromLibrary: (template: Furniture) => PlacementValidation;
  removeFurnitureFromProject: (furnitureId: string) => void;
  updateFurniture: (furnitureId: string, updates: Partial<Furniture>) => void;
  moveFurniture: (furnitureId: string, position: Vector3) => PlacementValidation;
  nudgeSelectedFurniture: (axis: 'x' | 'z', delta: number) => PlacementValidation;
  setSelectedFurniture: (furniture: Furniture | null) => void;
  setCameraPosition: (position: Vector3) => void;
  setCameraRotation: (rotation: Vector3) => void;
  setFpsMoveTarget: (position: Vector3 | null) => void;
  setPlacementMode: (enabled: boolean) => void;
  setPlacementValidation: (validation: PlacementValidation | null) => void;
  validatePlacement: (furniture: Furniture, position: Vector3) => PlacementValidation;
  addReconstructionTask: (task: ReconstructionTask) => void;
  updateReconstructionTask: (taskId: string, updates: Partial<ReconstructionTask>) => void;
  loadFurnitureLibrary: () => void;
}

const ts = () => Date.now();
const cloneFurniture = (f: Furniture): Furniture => JSON.parse(JSON.stringify(f));
const makeRoom = (input: NewRoomInput & { id: string }): Room => ({
  id: input.id,
  type: input.type,
  name: input.name,
  origin: { x: input.originX, y: 0, z: input.originZ },
  dimensions: { width: input.width, depth: input.depth, height: input.height },
  walls: [
    { id: `${input.id}-w1`, startPoint: { x: 0, y: 0, z: 0 }, endPoint: { x: input.width, y: 0, z: 0 }, height: input.height, thickness: 0.2, hasDoor: false, hasWindow: false },
    { id: `${input.id}-w2`, startPoint: { x: input.width, y: 0, z: 0 }, endPoint: { x: input.width, y: 0, z: input.depth }, height: input.height, thickness: 0.2, hasDoor: true, hasWindow: false },
    { id: `${input.id}-w3`, startPoint: { x: input.width, y: 0, z: input.depth }, endPoint: { x: 0, y: 0, z: input.depth }, height: input.height, thickness: 0.2, hasDoor: false, hasWindow: true },
    { id: `${input.id}-w4`, startPoint: { x: 0, y: 0, z: input.depth }, endPoint: { x: 0, y: 0, z: 0 }, height: input.height, thickness: 0.2, hasDoor: false, hasWindow: false },
  ],
  floor: { material: 'wood', color: '#8B4513' },
  ceiling: { material: 'paint', color: '#FFFFFF' },
});
const roomCenter = (r: Room): Vector3 => ({ x: r.origin.x + r.dimensions.width / 2, y: 0, z: r.origin.z + r.dimensions.depth / 2 });
const activeRoom = (p: DesignProject | null) => p?.rooms.find((r) => r.id === p.activeRoomId) ?? p?.rooms[0] ?? null;
const boundsOf = (f: Furniture, position: Vector3) => new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(position.x, (f.dimensions.height * f.scale.y) / 2, position.z),
  new THREE.Vector3(f.dimensions.width * f.scale.x, f.dimensions.height * f.scale.y, f.dimensions.depth * f.scale.z),
);

const furnitureLibrary: Furniture[] = [
  ['sofa-3seater-001', 'sofa', '三人沙发', 2.2, 0.9, 0.85], ['sofa-2seater-001', 'sofa', '双人沙发', 1.6, 0.85, 0.8],
  ['tv-65inch-001', 'tv', '65寸电视', 1.45, 0.08, 0.83], ['table-coffee-001', 'table', '茶几', 1.2, 0.6, 0.45],
  ['table-dining-001', 'table', '餐桌', 1.6, 0.9, 0.75], ['light-chandelier-001', 'light', '吊灯', 0.8, 0.8, 1.2],
  ['cabinet-tv-001', 'cabinet', '电视柜', 1.8, 0.4, 0.55], ['bed-queen-001', 'bed', '双人床', 1.8, 2, 1.1],
].map(([id, type, name, width, depth, height]) => ({ id: id as string, roomId: '', type: type as Furniture['type'], name: name as string, modelUrl: `/models/${id}.glb`, dimensions: { width: width as number, depth: depth as number, height: height as number }, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } }));

const living = makeRoom({ id: 'room-living-001', name: '客厅', type: 'living_room', width: 9.6, depth: 7.2, height: 3.1, originX: 0, originZ: 0 });
const bedroom = makeRoom({ id: 'room-bedroom-001', name: '主卧', type: 'bedroom', width: 4.2, depth: 4.8, height: 3, originX: 10.2, originZ: 0 });
const demoProject: DesignProject = {
  id: 'demo-project-001', name: '样板房设计方案', activeRoomId: living.id, rooms: [living, bedroom], materials: {}, createdAt: ts(), updatedAt: ts(),
  furniture: [
    { ...cloneFurniture(furnitureLibrary[0]), id: 'placed-sofa-001', roomId: living.id, position: { x: 2.2, y: 0, z: 1.2 } },
    { ...cloneFurniture(furnitureLibrary[2]), id: 'placed-tv-001', roomId: living.id, position: { x: 8.6, y: 0, z: 3.6 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 } },
    { ...cloneFurniture(furnitureLibrary[3]), id: 'placed-table-001', roomId: living.id, position: { x: 4.6, y: 0, z: 3.2 } },
    { ...cloneFurniture(furnitureLibrary[7]), id: 'placed-bed-001', roomId: bedroom.id, position: { x: 12.3, y: 0, z: 2.4 } },
  ],
};

export const useAppStore = create<AppState>((set, get) => ({
  projects: [], currentProject: null, reconstructionTasks: [], furnitureLibrary, selectedFurniture: null,
  cameraPosition: { x: 12, y: 10, z: 12 }, cameraRotation: { x: 0, y: 0, z: 0 }, fpsMoveTarget: null, placementMode: false, placementValidation: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
  updateProject: (projectId, updates) => set((s) => ({ projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...updates, updatedAt: ts() } : p)), currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, ...updates, updatedAt: ts() } : s.currentProject })),
  deleteProject: (projectId) => set((s) => ({ projects: s.projects.filter((p) => p.id !== projectId), currentProject: s.currentProject?.id === projectId ? null : s.currentProject })),
  ensureDemoProject: () => set((s) => (s.currentProject ? s : { projects: [demoProject], currentProject: demoProject })),
  setActiveRoom: (roomId) => set((s) => { if (!s.currentProject) return s; const p = { ...s.currentProject, activeRoomId: roomId, updatedAt: ts() }; return { currentProject: p, projects: s.projects.map((x) => (x.id === p.id ? p : x)), selectedFurniture: null, fpsMoveTarget: null }; }),
  addRoom: (input) => set((s) => { if (!s.currentProject) return s; const room = makeRoom({ ...input, id: `room-${ts()}` }); const p = { ...s.currentProject, rooms: [...s.currentProject.rooms, room], activeRoomId: room.id, updatedAt: ts() }; return { currentProject: p, projects: s.projects.map((x) => (x.id === p.id ? p : x)) }; }),
  updateRoom: (roomId, input) => set((s) => { if (!s.currentProject) return s; const nextRoom = makeRoom({ ...input, id: roomId }); const p = { ...s.currentProject, rooms: s.currentProject.rooms.map((r) => (r.id === roomId ? nextRoom : r)), updatedAt: ts() }; return { currentProject: p, projects: s.projects.map((x) => (x.id === p.id ? p : x)), fpsMoveTarget: null }; }),
  deleteRoom: (roomId) => set((s) => { if (!s.currentProject || s.currentProject.rooms.length <= 1) return s; const rooms = s.currentProject.rooms.filter((r) => r.id !== roomId); const p = { ...s.currentProject, rooms, activeRoomId: s.currentProject.activeRoomId === roomId ? rooms[0].id : s.currentProject.activeRoomId, furniture: s.currentProject.furniture.filter((f) => f.roomId !== roomId), updatedAt: ts() }; return { currentProject: p, projects: s.projects.map((x) => (x.id === p.id ? p : x)), selectedFurniture: null }; }),
  addFurnitureToProject: (furniture) => set((s) => { if (!s.currentProject) return s; const p = { ...s.currentProject, furniture: [...s.currentProject.furniture, cloneFurniture(furniture)], updatedAt: ts() }; return { currentProject: p, projects: s.projects.map((x) => (x.id === p.id ? p : x)) }; }),
  addFurnitureFromLibrary: (template) => { const room = activeRoom(get().currentProject); if (!room) return { valid: false, message: '当前没有可用房间' }; const c = roomCenter(room); const f = { ...cloneFurniture(template), id: `${template.id}-${ts()}`, roomId: room.id, position: c }; const v = get().validatePlacement(f, f.position); if (!v.valid) { set({ placementValidation: v }); return v; } get().addFurnitureToProject(f); set({ selectedFurniture: f, placementValidation: { valid: true, message: `已添加 ${template.name}` } }); return { valid: true }; },
  removeFurnitureFromProject: (furnitureId) => set((s) => { if (!s.currentProject) return s; const p = { ...s.currentProject, furniture: s.currentProject.furniture.filter((f) => f.id !== furnitureId), updatedAt: ts() }; return { currentProject: p, projects: s.projects.map((x) => (x.id === p.id ? p : x)), selectedFurniture: null }; }),
  updateFurniture: (furnitureId, updates) => set((s) => { if (!s.currentProject) return s; const p = { ...s.currentProject, furniture: s.currentProject.furniture.map((f) => (f.id === furnitureId ? { ...f, ...updates } : f)), updatedAt: ts() }; return { currentProject: p, projects: s.projects.map((x) => (x.id === p.id ? p : x)), selectedFurniture: s.selectedFurniture?.id === furnitureId ? { ...s.selectedFurniture, ...updates } : s.selectedFurniture }; }),
  moveFurniture: (furnitureId, position) => { const f = get().currentProject?.furniture.find((x) => x.id === furnitureId); if (!f) return { valid: false, message: '未找到要移动的家具' }; const v = get().validatePlacement(f, position); set({ placementValidation: v }); if (v.valid) get().updateFurniture(furnitureId, { position }); return v; },
  nudgeSelectedFurniture: (axis, delta) => { const f = get().selectedFurniture; if (!f) return { valid: false, message: '请先选中一个家具' }; return get().moveFurniture(f.id, { ...f.position, [axis]: Number((f.position[axis] + delta).toFixed(2)) }); },
  setSelectedFurniture: (furniture) => set({ selectedFurniture: furniture }), setCameraPosition: (position) => set({ cameraPosition: position }), setCameraRotation: (rotation) => set({ cameraRotation: rotation }), setFpsMoveTarget: (position) => set({ fpsMoveTarget: position }), setPlacementMode: (enabled) => set({ placementMode: enabled }), setPlacementValidation: (validation) => set({ placementValidation: validation }),
  validatePlacement: (furniture, position) => { const p = get().currentProject; if (!p) return { valid: true }; const room = p.rooms.find((r) => r.id === furniture.roomId) ?? activeRoom(p); if (!room) return { valid: true }; const hw = (furniture.dimensions.width * furniture.scale.x) / 2; const hd = (furniture.dimensions.depth * furniture.scale.z) / 2; if (position.x - hw < room.origin.x || position.x + hw > room.origin.x + room.dimensions.width) return { valid: false, message: `${furniture.name} 超出 ${room.name} 宽度` }; if (position.z - hd < room.origin.z || position.z + hd > room.origin.z + room.dimensions.depth) return { valid: false, message: `${furniture.name} 超出 ${room.name} 深度` }; const box = boundsOf(furniture, position); const conflict = p.furniture.find((x) => x.roomId === furniture.roomId && x.id !== furniture.id && box.intersectsBox(boundsOf(x, x.position))); return conflict ? { valid: false, message: `与 “${conflict.name}” 位置冲突` } : { valid: true, message: `${furniture.name} 已移动` }; },
  addReconstructionTask: (task) => set((s) => ({ reconstructionTasks: [...s.reconstructionTasks, task] })), updateReconstructionTask: (taskId, updates) => set((s) => ({ reconstructionTasks: s.reconstructionTasks.map((t) => (t.taskId === taskId ? { ...t, ...updates } : t)) })), loadFurnitureLibrary: () => set({ furnitureLibrary }),
}));
