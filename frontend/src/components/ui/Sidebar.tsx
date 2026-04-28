import React, { useEffect, useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Furniture, FurnitureType, RoomType } from '../../types';

const categoryLabels: Record<FurnitureType, string> = { sofa: '沙发', chair: '椅子', table: '桌子', cabinet: '柜子', bed: '床', tv: '电视', light: '灯具', rug: '地毯', plant: '绿植' };
const roomTypeLabels: Record<RoomType, string> = { living_room: '客厅', bedroom: '卧室', kitchen: '厨房', bathroom: '卫生间', dining_room: '餐厅', office: '书房', balcony: '阳台', corridor: '走廊' };

type RoomFormState = { name: string; type: RoomType; width: number; depth: number; height: number; originX: number; originZ: number };

const furnitureByCategory = (furnitureList: Furniture[]): Record<FurnitureType, Furniture[]> => furnitureList.reduce((acc, item) => { if (!acc[item.type]) acc[item.type] = []; acc[item.type].push(item); return acc; }, {} as Record<FurnitureType, Furniture[]>);
const defaultNewRoom: RoomFormState = { name: '新房间', type: 'bedroom', width: 4, depth: 3.6, height: 3, originX: 0, originZ: 8 };

const FurnitureItem: React.FC<{ furniture: Furniture; onAdd: (furniture: Furniture) => void }> = ({ furniture, onAdd }) => <button className="furniture-item" onClick={() => onAdd(furniture)}><div className="furniture-item-name">{furniture.name}</div><div className="furniture-item-dimensions">{furniture.dimensions.width}m × {furniture.dimensions.depth}m × {furniture.dimensions.height}m</div><div className="furniture-item-action">加入当前房间</div></button>;

const RoomFields: React.FC<{ value: RoomFormState; onChange: (value: RoomFormState) => void }> = ({ value, onChange }) => {
  const patch = (updates: Partial<RoomFormState>) => onChange({ ...value, ...updates });
  return (
    <>
      <input value={value.name} onChange={(e) => patch({ name: e.target.value })} placeholder="房间名称" />
      <select value={value.type} onChange={(e) => patch({ type: e.target.value as RoomType })}>{Object.entries(roomTypeLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select>
      <div className="form-grid"><label>宽<input type="number" value={value.width} min={1.5} step={0.1} onChange={(e) => patch({ width: Number(e.target.value) })} /></label><label>深<input type="number" value={value.depth} min={1.5} step={0.1} onChange={(e) => patch({ depth: Number(e.target.value) })} /></label></div>
      <div className="form-grid"><label>高<input type="number" value={value.height} min={2.2} step={0.1} onChange={(e) => patch({ height: Number(e.target.value) })} /></label><label>X<input type="number" value={value.originX} step={0.1} onChange={(e) => patch({ originX: Number(e.target.value) })} /></label></div>
      <label>Z<input type="number" value={value.originZ} step={0.1} onChange={(e) => patch({ originZ: Number(e.target.value) })} /></label>
    </>
  );
};

export const Sidebar: React.FC = () => {
  const { furnitureLibrary, currentProject, addFurnitureFromLibrary, selectedFurniture, removeFurnitureFromProject, nudgeSelectedFurniture, setActiveRoom, addRoom, updateRoom, deleteRoom } = useAppStore();
  const [newRoom, setNewRoom] = useState<RoomFormState>(defaultNewRoom);
  const [editRoom, setEditRoom] = useState<RoomFormState | null>(null);
  const categories = furnitureByCategory(furnitureLibrary);
  const sortedCategories = Object.keys(categories).sort() as FurnitureType[];
  const activeRoom = currentProject?.rooms.find((room) => room.id === currentProject.activeRoomId) ?? currentProject?.rooms[0];

  useEffect(() => {
    if (!activeRoom) return;
    setEditRoom({ name: activeRoom.name, type: activeRoom.type, width: activeRoom.dimensions.width, depth: activeRoom.dimensions.depth, height: activeRoom.dimensions.height, originX: activeRoom.origin.x, originZ: activeRoom.origin.z });
  }, [activeRoom]);

  const handleAddRoom = () => {
    addRoom(newRoom);
    setNewRoom({ ...newRoom, name: `${roomTypeLabels[newRoom.type]} ${Date.now().toString().slice(-4)}`, originX: newRoom.originX + newRoom.width + 0.6 });
  };

  const handleUpdateRoom = () => {
    if (!activeRoom || !editRoom) return;
    updateRoom(activeRoom.id, editRoom);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header"><h1>房屋设计</h1><p>{currentProject ? currentProject.name : '未加载项目'}</p></div>

      <div className="room-panel">
        <div className="panel-title">房间管理</div>
        <div className="room-list">{currentProject?.rooms.map((room) => <button key={room.id} className={`room-item ${room.id === activeRoom?.id ? 'active' : ''}`} onClick={() => setActiveRoom(room.id)}><span>{room.name}</span><small>{room.dimensions.width}m × {room.dimensions.depth}m</small></button>)}</div>
        {activeRoom && <div className="selected-card-meta">当前房间：{activeRoom.name}（{roomTypeLabels[activeRoom.type]}）</div>}

        {activeRoom && editRoom && <div className="room-form"><div className="panel-subtitle">编辑当前房间</div><RoomFields value={editRoom} onChange={setEditRoom} /><button className="primary-button" onClick={handleUpdateRoom}>保存当前房间</button>{currentProject && currentProject.rooms.length > 1 && <button className="danger-button" onClick={() => deleteRoom(activeRoom.id)}>删除当前房间</button>}</div>}

        <div className="room-form"><div className="panel-subtitle">添加新房间</div><RoomFields value={newRoom} onChange={setNewRoom} /><button className="primary-button" onClick={handleAddRoom}>添加矩形房间</button></div>
      </div>

      {selectedFurniture && <div className="selected-card"><div className="selected-card-title">当前选中</div><div className="selected-card-name">{selectedFurniture.name}</div><div className="selected-card-meta">位置：X {selectedFurniture.position.x.toFixed(2)} / Z {selectedFurniture.position.z.toFixed(2)}</div><div className="nudge-grid"><button className="mini-button" onClick={() => nudgeSelectedFurniture('z', -0.2)}>向上</button><div className="nudge-row"><button className="mini-button" onClick={() => nudgeSelectedFurniture('x', -0.2)}>向左</button><button className="mini-button" onClick={() => nudgeSelectedFurniture('x', 0.2)}>向右</button></div><button className="mini-button" onClick={() => nudgeSelectedFurniture('z', 0.2)}>向下</button></div><button className="danger-button" onClick={() => removeFurnitureFromProject(selectedFurniture.id)}>删除该家具</button></div>}

      <div className="sidebar-content"><div className="panel-title">家具库</div>{sortedCategories.map((category) => <div key={category} className="furniture-category"><h3>{categoryLabels[category]}</h3><div className="furniture-list">{categories[category].map((furniture) => <FurnitureItem key={furniture.id} furniture={furniture} onAdd={addFurnitureFromLibrary} />)}</div></div>)}{sortedCategories.length === 0 && <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px' }}>暂无家具数据</div>}</div>
    </div>
  );
};
