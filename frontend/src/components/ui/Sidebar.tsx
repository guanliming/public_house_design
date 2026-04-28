import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { Furniture, FurnitureType, RoomType } from '../../types';

const categoryLabels: Record<FurnitureType, string> = { sofa: '沙发', chair: '椅子', table: '桌子', cabinet: '柜子', bed: '床', tv: '电视', light: '灯具', rug: '地毯', plant: '绿植' };
const roomTypeLabels: Record<RoomType, string> = { living_room: '客厅', bedroom: '卧室', kitchen: '厨房', bathroom: '卫生间', dining_room: '餐厅', office: '书房', balcony: '阳台', corridor: '走廊' };

const furnitureByCategory = (furnitureList: Furniture[]): Record<FurnitureType, Furniture[]> => furnitureList.reduce((acc, item) => { if (!acc[item.type]) acc[item.type] = []; acc[item.type].push(item); return acc; }, {} as Record<FurnitureType, Furniture[]>);

const FurnitureItem: React.FC<{ furniture: Furniture; onAdd: (furniture: Furniture) => void }> = ({ furniture, onAdd }) => {
  const { dimensions, name } = furniture;
  return <button className="furniture-item" onClick={() => onAdd(furniture)}><div className="furniture-item-name">{name}</div><div className="furniture-item-dimensions">{dimensions.width}m × {dimensions.depth}m × {dimensions.height}m</div><div className="furniture-item-action">加入当前房间</div></button>;
};

export const Sidebar: React.FC = () => {
  const { furnitureLibrary, currentProject, addFurnitureFromLibrary, selectedFurniture, removeFurnitureFromProject, nudgeSelectedFurniture, setActiveRoom, addRoom, deleteRoom } = useAppStore();
  const [roomName, setRoomName] = useState('新房间');
  const [roomType, setRoomType] = useState<RoomType>('bedroom');
  const [width, setWidth] = useState(4);
  const [depth, setDepth] = useState(3.6);
  const [height, setHeight] = useState(3);
  const [originX, setOriginX] = useState(0);
  const [originZ, setOriginZ] = useState(8);
  const categories = furnitureByCategory(furnitureLibrary);
  const sortedCategories = Object.keys(categories).sort() as FurnitureType[];
  const activeRoom = currentProject?.rooms.find((room) => room.id === currentProject.activeRoomId) ?? currentProject?.rooms[0];

  const handleAddRoom = () => {
    addRoom({ name: roomName, type: roomType, width, depth, height, originX, originZ });
    setRoomName(`${roomTypeLabels[roomType]} ${Date.now().toString().slice(-4)}`);
    setOriginX(originX + width + 0.6);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header"><h1>房屋设计</h1><p>{currentProject ? currentProject.name : '未加载项目'}</p></div>

      <div className="room-panel">
        <div className="panel-title">房间管理</div>
        <div className="room-list">
          {currentProject?.rooms.map((room) => (
            <button key={room.id} className={`room-item ${room.id === activeRoom?.id ? 'active' : ''}`} onClick={() => setActiveRoom(room.id)}>
              <span>{room.name}</span>
              <small>{room.dimensions.width}m × {room.dimensions.depth}m</small>
            </button>
          ))}
        </div>
        {activeRoom && <div className="selected-card-meta">当前房间：{activeRoom.name}（{roomTypeLabels[activeRoom.type]}）</div>}
        <div className="room-form">
          <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="房间名称" />
          <select value={roomType} onChange={(e) => setRoomType(e.target.value as RoomType)}>{Object.entries(roomTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <div className="form-grid"><label>宽<input type="number" value={width} min={1.5} step={0.1} onChange={(e) => setWidth(Number(e.target.value))} /></label><label>深<input type="number" value={depth} min={1.5} step={0.1} onChange={(e) => setDepth(Number(e.target.value))} /></label></div>
          <div className="form-grid"><label>高<input type="number" value={height} min={2.2} step={0.1} onChange={(e) => setHeight(Number(e.target.value))} /></label><label>X<input type="number" value={originX} step={0.1} onChange={(e) => setOriginX(Number(e.target.value))} /></label></div>
          <label>Z<input type="number" value={originZ} step={0.1} onChange={(e) => setOriginZ(Number(e.target.value))} /></label>
          <button className="primary-button" onClick={handleAddRoom}>添加矩形房间</button>
          {activeRoom && currentProject && currentProject.rooms.length > 1 && <button className="danger-button" onClick={() => deleteRoom(activeRoom.id)}>删除当前房间</button>}
        </div>
      </div>

      {selectedFurniture && <div className="selected-card"><div className="selected-card-title">当前选中</div><div className="selected-card-name">{selectedFurniture.name}</div><div className="selected-card-meta">位置：X {selectedFurniture.position.x.toFixed(2)} / Z {selectedFurniture.position.z.toFixed(2)}</div><div className="nudge-grid"><button className="mini-button" onClick={() => nudgeSelectedFurniture('z', -0.2)}>向上</button><div className="nudge-row"><button className="mini-button" onClick={() => nudgeSelectedFurniture('x', -0.2)}>向左</button><button className="mini-button" onClick={() => nudgeSelectedFurniture('x', 0.2)}>向右</button></div><button className="mini-button" onClick={() => nudgeSelectedFurniture('z', 0.2)}>向下</button></div><button className="danger-button" onClick={() => removeFurnitureFromProject(selectedFurniture.id)}>删除该家具</button></div>}

      <div className="sidebar-content">
        <div className="panel-title">家具库</div>
        {sortedCategories.map((category) => <div key={category} className="furniture-category"><h3>{categoryLabels[category]}</h3><div className="furniture-list">{categories[category].map((furniture) => <FurnitureItem key={furniture.id} furniture={furniture} onAdd={addFurnitureFromLibrary} />)}</div></div>)}
        {sortedCategories.length === 0 && <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px' }}>暂无家具数据</div>}
      </div>
    </div>
  );
};
