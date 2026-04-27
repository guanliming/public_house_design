import React from 'react';
import { useAppStore } from '../../store/appStore';
import { Furniture, FurnitureType } from '../../types';

const categoryLabels: Record<FurnitureType, string> = {
  sofa: '沙发',
  chair: '椅子',
  table: '桌子',
  cabinet: '柜子',
  bed: '床',
  tv: '电视',
  light: '灯具',
  rug: '地毯',
  plant: '绿植',
};

const furnitureByCategory = (furnitureList: Furniture[]): Record<FurnitureType, Furniture[]> => {
  return furnitureList.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = [];
    acc[item.type].push(item);
    return acc;
  }, {} as Record<FurnitureType, Furniture[]>);
};

const FurnitureItem: React.FC<{ furniture: Furniture; onAdd: (furniture: Furniture) => void }> = ({ furniture, onAdd }) => {
  const { dimensions, name } = furniture;
  return (
    <button className="furniture-item" onClick={() => onAdd(furniture)}>
      <div className="furniture-item-name">{name}</div>
      <div className="furniture-item-dimensions">{dimensions.width}m × {dimensions.depth}m × {dimensions.height}m</div>
      <div className="furniture-item-action">点击加入房间</div>
    </button>
  );
};

export const Sidebar: React.FC = () => {
  const {
    furnitureLibrary,
    currentProject,
    addFurnitureFromLibrary,
    selectedFurniture,
    removeFurnitureFromProject,
    nudgeSelectedFurniture,
  } = useAppStore();

  const categories = furnitureByCategory(furnitureLibrary);
  const sortedCategories = Object.keys(categories).sort() as FurnitureType[];

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>家具库</h1>
        <p>{currentProject ? currentProject.name : '未加载项目'}</p>
      </div>

      {selectedFurniture && (
        <div className="selected-card">
          <div className="selected-card-title">当前选中</div>
          <div className="selected-card-name">{selectedFurniture.name}</div>
          <div className="selected-card-meta">
            位置：X {selectedFurniture.position.x.toFixed(2)} / Z {selectedFurniture.position.z.toFixed(2)}
          </div>
          <div className="nudge-grid">
            <button className="mini-button" onClick={() => nudgeSelectedFurniture('z', -0.2)}>向上</button>
            <div className="nudge-row">
              <button className="mini-button" onClick={() => nudgeSelectedFurniture('x', -0.2)}>向左</button>
              <button className="mini-button" onClick={() => nudgeSelectedFurniture('x', 0.2)}>向右</button>
            </div>
            <button className="mini-button" onClick={() => nudgeSelectedFurniture('z', 0.2)}>向下</button>
          </div>
          <button className="danger-button" onClick={() => removeFurnitureFromProject(selectedFurniture.id)}>删除该家具</button>
        </div>
      )}

      <div className="sidebar-content">
        {sortedCategories.map((category) => (
          <div key={category} className="furniture-category">
            <h3>{categoryLabels[category]}</h3>
            <div className="furniture-list">
              {categories[category].map((furniture) => (
                <FurnitureItem key={furniture.id} furniture={furniture} onAdd={addFurnitureFromLibrary} />
              ))}
            </div>
          </div>
        ))}

        {sortedCategories.length === 0 && <div style={{ color: '#a0a0a0', textAlign: 'center', padding: '20px' }}>暂无家具数据</div>}
      </div>
    </div>
  );
};
