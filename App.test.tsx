import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Fix: Declare Jest globals to resolve TypeScript errors about missing names
declare const jest: any;
declare const describe: any;
declare const test: any;
declare const expect: any;

// Mock scrollIntoView as it is not implemented in JSDOM
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('玉美人 Game Flow Tests', () => {
  
  test('Game initializes with correct title and players', () => {
    render(<App />);
    
    // 验证游戏标题存在
    expect(screen.getByText('玉美人 · 雅室争艳')).toBeInTheDocument();
    
    // 验证两位玩家初始名字显示
    expect(screen.getByText('博雅君子')).toBeInTheDocument();
    expect(screen.getByText('风流雅士')).toBeInTheDocument();
    
    // 验证三个等级的珍宝阁（市场）区域已渲染
    expect(screen.getByText('上品 · 旷世重器')).toBeInTheDocument();
    expect(screen.getByText('中品 · 琳琅佳品')).toBeInTheDocument();
    expect(screen.getByText('下品 · 璞玉待琢')).toBeInTheDocument();
  });

  test('Player can select a single jade token and take it', async () => {
    render(<App />);
    
    // 查找棋盘上的玉石 (排除黄金，因为黄金不能直接选取)
    // 我们查找常见的玉石名称
    const jadeNames = ['白玉', '翠玉', '蓝宝', '赤瑙', '紫翡', '明珠'];
    const tiles = screen.queryAllByText((content, element) => {
        return jadeNames.includes(content) && element?.tagName.toLowerCase() === 'span';
    });
    
    // 确保棋盘上有玉石
    expect(tiles.length).toBeGreaterThan(0);
    
    // 模拟点击第一个可用的玉石
    const firstTile = tiles[0];
    fireEvent.click(firstTile);
    
    // 期望出现 "采选珍石 (1)" 按钮
    const takeButton = await screen.findByText('采选珍石 (1)');
    expect(takeButton).toBeInTheDocument();
    
    // 点击采选按钮确认
    fireEvent.click(takeButton);
    
    // 验证操作日志是否更新，确认动作已执行
    expect(screen.getByText(/博雅君子 采选了连续的玉石/)).toBeInTheDocument();
  });

  test('Replenishing the board grants privilege to opponent', () => {
    render(<App />);
    
    // 初始状态：当前玩家是 0 (博雅君子)
    // 填充棋盘应给予 玩家 1 (风流雅士) 一个特权（旨意）
    
    // 查找并点击填充按钮
    const replenishBtn = screen.getByText(/填充珍宝阁/);
    fireEvent.click(replenishBtn);
    
    // 验证日志中是否出现对手获得旨意的信息
    expect(screen.getByText('风流雅士 获得一份旨意。')).toBeInTheDocument();
    expect(screen.getByText('珍宝阁已重新充盈。')).toBeInTheDocument();
  });

});