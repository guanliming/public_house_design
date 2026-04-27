import React from 'react';

type ViewMode = 'orbit' | 'fps' | 'placement';

interface HelpPanelProps {
  viewMode: ViewMode;
}

export const HelpPanel: React.FC<HelpPanelProps> = ({ viewMode }) => {
  const getHelpContent = () => {
    switch (viewMode) {
      case 'orbit':
        return (
          <>
            <div><strong>上帝视角</strong></div>
            <div><kbd>鼠标拖拽</kbd> 旋转视角</div>
            <div><kbd>滚轮</kbd> 缩放</div>
            <div><kbd>右键拖拽</kbd> 平移</div>
          </>
        );
      case 'fps':
        return (
          <>
            <div><strong>第一视角</strong></div>
            <div><kbd>鼠标拖拽</kbd> 缓慢环视</div>
            <div>当前已关闭缩放和平移</div>
            <div>当前暂不开放 WASD 漫游，优先保证稳定</div>
          </>
        );
      case 'placement':
        return (
          <>
            <div><strong>家具编辑</strong></div>
            <div><kbd>点击家具</kbd> 选中</div>
            <div><kbd>点击地板</kbd> 移动选中家具</div>
            <div><kbd>左侧微调按钮</kbd> 精准移动</div>
            <div><kbd>红色提示</kbd> 表示尺寸冲突</div>
          </>
        );
      default:
        return null;
    }
  };

  return <div className="help-panel">{getHelpContent()}</div>;
};
