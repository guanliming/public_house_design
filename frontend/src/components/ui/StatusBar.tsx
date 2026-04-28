import React from 'react';
import { useAppStore } from '../../store/appStore';

type ViewMode = 'orbit' | 'fps' | 'placement';

interface StatusBarProps {
  viewMode: ViewMode;
}

export const StatusBar: React.FC<StatusBarProps> = ({ viewMode }) => {
  const { currentProject, cameraPosition, selectedFurniture } = useAppStore();

  const modeLabels: Record<ViewMode, string> = {
    orbit: '上帝视角',
    fps: '第一视角漫游',
    placement: '家具编辑',
  };

  const room = currentProject?.rooms.find((item) => item.id === currentProject.activeRoomId) ?? currentProject?.rooms[0];

  return (
    <div className="status-bar">
      <div>
        <strong>模式:</strong> {modeLabels[viewMode]}
      </div>
      <div className="position">
        <strong>相机位置:</strong>
        {' '}X: {cameraPosition.x.toFixed(1)}
        {' '}Y: {cameraPosition.y.toFixed(1)}
        {' '}Z: {cameraPosition.z.toFixed(1)}
      </div>
      {room && (
        <div className="position">
          <strong>房间:</strong> {room.name} / {room.dimensions.width.toFixed(1)}m × {room.dimensions.depth.toFixed(1)}m × {room.dimensions.height.toFixed(1)}m @ X {room.origin.x.toFixed(1)} Z {room.origin.z.toFixed(1)}
        </div>
      )}
      {selectedFurniture && (
        <div className="position">
          <strong>选中:</strong> {selectedFurniture.name}
          {' '}@ ({selectedFurniture.position.x.toFixed(1)}, {selectedFurniture.position.z.toFixed(1)})
        </div>
      )}
      {currentProject && (
        <div className="position">
          <strong>项目:</strong> {currentProject.name}
        </div>
      )}
    </div>
  );
};
