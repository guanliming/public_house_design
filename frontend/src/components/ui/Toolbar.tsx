import React from 'react';

type ViewMode = 'orbit' | 'fps' | 'placement';

interface ToolbarProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ currentMode, onModeChange }) => {
  const modes: { id: ViewMode; label: string; description: string }[] = [
    { id: 'orbit', label: '上帝视角', description: '俯视/环绕查看整体布局' },
    { id: 'fps', label: '第一视角', description: '像人在屋里一样漫游' },
    { id: 'placement', label: '家具编辑', description: '选中家具并重新摆放' },
  ];

  return (
    <div className="toolbar">
      {modes.map((mode) => (
        <button
          key={mode.id}
          className={`toolbar-button ${currentMode === mode.id ? 'active' : ''}`}
          onClick={() => onModeChange(mode.id)}
          title={mode.description}
        >
          <span>{mode.label}</span>
        </button>
      ))}
    </div>
  );
};
