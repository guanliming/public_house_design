import { create } from 'zustand';
import * as THREE from 'three';
import { DesignProject, Furniture, PlacementValidation, ReconstructionTask, Room, Vector3 } from '../types';

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

const sampleRoom: Room = {
  id: 'room-living-001',
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
  ceiling: { material: 'matte_paint', color: '#FFFFFF' },
};

const furnitureLibrary: Furniture[] = [
  ['sofa-3seater-001', 'sofa', '三人沙发', 2.2, 0.9, 0.85],
  ['sofa-2seater-001', 'sofa', '双人沙发', 1.6, 0.85, 0.8],
  ['tv-65inch-001', 'tv', '65寸电视', 1.45, 0.08, 0.83],
  ['table-coffee-001', 'table', '茶几', 1.2, 0.6, 0.45],
  ['table-dining-001', 'table', '餐桌', 1.6, 0.9, 0.75],
  ['light-chandelier-001', 'light', '吊灯', 0.8, 0.8, 1.2],
  ['cabinet-tv-001', 'cabinet', '电视柜', 1.8, 0.4, 0.55],
  ['bed-queen-001', 'bed', '双人床', 1.8, 2, 1.1],
].map(([id, type, name, width, depth, height]) => ({
  id: id as string,
  type: type as Furniture['type'],
  name: name as string,
  modelUrl: `/models/${id}.glb`,
  dimensions: { width: width as number, depth: depth as number, height: height as number },
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
}));

const ts = () => Date.now();
const cloneFurniture = (f: Furniture): Furniture => JSON.parse(JSON.stringify(f));
const boundsOf = (f: Furniture, position: Vector3) => new THREE.Box3().setFromCenterAndSize(
  new THREE.Vector3(position.x, (f.dimensions.height * f.scale.y) / 2, position.z),
  new THREE.Vector3(f.dimensions.width * f.scale.x, f.dimensions.height * f.scale.y, f.dimensions.depth * f.scale.z),
);

const demoProject: DesignProject = {
  id: 'demo-project-001',
  name: '样板房设计方案',
  rooms: [sampleRoom],
  furniture: [
    { ...cloneFurniture(furnitureLibrary[0]), id: 'placed-sofa-001', position: { x: 2.2, y: 0, z: 1.2 } },
    { ...cloneFurniture(furnitureLibrary[2]), id: 'placed-tv-001', position: { x: 8.6, y: 0, z: 3.6 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 } },
    { ...cloneFurniture(furnitureLibrary[3]), id: 'placed-table-001', position: { x: 4.6, y: 0, z: 3.2 } },
  ],
  materials: {},
  createdAt: ts(),
  updatedAt: ts(),
};

export const useAppStore = create<AppState>((set, get) => ({
  projects: [],
  currentProject: null,
  reconstructionTasks: [],
  furnitureLibrary,
  selectedFurniture: null,
  cameraPosition: { x: 12, y: 10, z: 12 },
  cameraRotation: { x: 0, y: 0, z: 0 },
  fpsMoveTarget: null,
  placementMode: false,
  placementValidation: null,

  setCurrentProject: (project) => set({ currentProject: project }),
  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
  updateProject: (projectId, updates) => set((s) => ({
    projects: s.projects.map((p) => (p.id === projectId ? { ...p, ...updates, updatedAt: ts() } : p)),
    currentProject: s.currentProject?.id === projectId ? { ...s.currentProject, ...updates, updatedAt: ts() } : s.currentProject,
  })),
  deleteProject: (projectId) => set((s) => ({
    projects: s.projects.filter((p) => p.id !== projectId),
    currentProject: s.currentProject?.id === projectId ? null : s.currentProject,
  })),
  ensureDemoProject: () => set((s) => (s.currentProject ? s : { projects: [demoProject], currentProject: demoProject })),

  addFurnitureToProject: (furniture) => set((s) => {
    if (!s.currentProject) return s;
    const updatedProject = { ...s.currentProject, furniture: [...s.currentProject.furniture, cloneFurniture(furniture)], updatedAt: ts() };
    return { currentProject: updatedProject, projects: s.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)) };
  }),
  addFurnitureFromLibrary: (template) => {
    const room = get().currentProject?.rooms[0];
    if (!room) return { valid: false, message: '当前没有可用房间' };
    const furniture = {
      ...cloneFurniture(template),
      id: `${template.id}-${ts()}`,
      position: { x: room.dimensions.width / 2, y: 0, z: room.dimensions.depth / 2 },
    };
    const validation = get().validatePlacement(furniture, furniture.position);
    if (!validation.valid) {
      set({ placementValidation: validation });
      return validation;
    }
    get().addFurnitureToProject(furniture);
    set({ selectedFurniture: furniture, placementValidation: { valid: true, message: `已添加 ${template.name}` } });
    return { valid: true };
  },
  removeFurnitureFromProject: (furnitureId) => set((s) => {
    if (!s.currentProject) return s;
    const updatedProject = { ...s.currentProject, furniture: s.currentProject.furniture.filter((f) => f.id !== furnitureId), updatedAt: ts() };
    return { currentProject: updatedProject, projects: s.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)), selectedFurniture: null };
  }),
  updateFurniture: (furnitureId, updates) => set((s) => {
    if (!s.currentProject) return s;
    const updatedProject = { ...s.currentProject, furniture: s.currentProject.furniture.map((f) => (f.id === furnitureId ? { ...f, ...updates } : f)), updatedAt: ts() };
    return {
      currentProject: updatedProject,
      projects: s.projects.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
      selectedFurniture: s.selectedFurniture?.id === furnitureId ? { ...s.selectedFurniture, ...updates } : s.selectedFurniture,
    };
  }),
  moveFurniture: (furnitureId, position) => {
    const furniture = get().currentProject?.furniture.find((f) => f.id === furnitureId);
    if (!furniture) return { valid: false, message: '未找到要移动的家具' };
    const validation = get().validatePlacement(furniture, position);
    set({ placementValidation: validation });
    if (validation.valid) get().updateFurniture(furnitureId, { position });
    return validation;
  },
  nudgeSelectedFurniture: (axis, delta) => {
    const selected = get().selectedFurniture;
    if (!selected) return { valid: false, message: '请先选中一个家具' };
    const nextPosition = {
      ...selected.position,
      [axis]: Number((selected.position[axis] + delta).toFixed(2)),
    };
    return get().moveFurniture(selected.id, nextPosition);
  },
  setSelectedFurniture: (furniture) => set({ selectedFurniture: furniture }),
  setCameraPosition: (position) => set({ cameraPosition: position }),
  setCameraRotation: (rotation) => set({ cameraRotation: rotation }),
  setFpsMoveTarget: (position) => set({ fpsMoveTarget: position }),
  setPlacementMode: (enabled) => set({ placementMode: enabled }),
  setPlacementValidation: (validation) => set({ placementValidation: validation }),
  validatePlacement: (furniture, position) => {
    const project = get().currentProject;
    const room = project?.rooms[0];
    if (!project || !room) return { valid: true };
    const halfWidth = (furniture.dimensions.width * furniture.scale.x) / 2;
    const halfDepth = (furniture.dimensions.depth * furniture.scale.z) / 2;
    if (position.x - halfWidth < 0 || position.x + halfWidth > room.dimensions.width) return { valid: false, message: `${furniture.name} 超出房间宽度` };
    if (position.z - halfDepth < 0 || position.z + halfDepth > room.dimensions.depth) return { valid: false, message: `${furniture.name} 超出房间深度` };
    const targetBox = boundsOf(furniture, position);
    const conflict = project.furniture.find((existing) => existing.id !== furniture.id && targetBox.intersectsBox(boundsOf(existing, existing.position)));
    return conflict ? { valid: false, message: `与 “${conflict.name}” 位置冲突` } : { valid: true, message: `${furniture.name} 已移动` };
  },
  addReconstructionTask: (task) => set((s) => ({ reconstructionTasks: [...s.reconstructionTasks, task] })),
  updateReconstructionTask: (taskId, updates) => set((s) => ({ reconstructionTasks: s.reconstructionTasks.map((t) => (t.taskId === taskId ? { ...t, ...updates } : t)) })),
  loadFurnitureLibrary: () => set({ furnitureLibrary }),
}));
