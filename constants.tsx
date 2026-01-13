
import { JadeType, JadeCard, Beauty, CardAbility } from './types';

export const JADE_COLORS: Record<JadeType, string> = {
  [JadeType.WHITE]: 'bg-slate-200 border-slate-400 text-slate-800', // 稍微加深白玉色值
  [JadeType.GREEN]: 'bg-emerald-600 border-emerald-800 text-white',
  [JadeType.BLUE]: 'bg-blue-600 border-blue-800 text-white',
  [JadeType.RED]: 'bg-rose-700 border-rose-900 text-white',
  [JadeType.PURPLE]: 'bg-purple-900 border-purple-950 text-white',
  [JadeType.PEARL]: 'bg-pink-100 border-pink-300 text-pink-800',
  [JadeType.GOLD]: 'bg-yellow-500 border-yellow-700 text-white',
};

// 卡片专用主题色
export const CARD_THEMES: Record<string, { bg: string, accent: string, text: string, glow: string, crack: string }> = {
  [JadeType.WHITE]: { bg: '#f1f5f9', accent: '#cbd5e1', text: '#334155', glow: 'rgba(203,213,225,0.6)', crack: '#94a3b8' },
  [JadeType.GREEN]: { bg: '#ecfdf5', accent: '#059669', text: '#064e3b', glow: 'rgba(16,185,129,0.5)', crack: '#10b981' },
  [JadeType.BLUE]: { bg: '#eff6ff', accent: '#2563eb', text: '#1e3a8a', glow: 'rgba(59,130,246,0.5)', crack: '#3b82f6' },
  [JadeType.RED]: { bg: '#fff1f2', accent: '#e11d48', text: '#881337', glow: 'rgba(244,63,94,0.5)', crack: '#fb7185' },
  [JadeType.PURPLE]: { bg: '#faf5ff', accent: '#7c3aed', text: '#4c1d95', glow: 'rgba(168,85,247,0.5)', crack: '#a855f7' },
  DEFAULT: { bg: '#ffffff', accent: '#d6d3d1', text: '#44403c', glow: 'rgba(255,255,255,0.3)', crack: '#a8a29e' }
};

export const JADE_LABELS: Record<JadeType, string> = {
  [JadeType.WHITE]: '白玉',
  [JadeType.GREEN]: '翠玉',
  [JadeType.BLUE]: '蓝宝',
  [JadeType.RED]: '赤瑙',
  [JadeType.PURPLE]: '紫翡',
  [JadeType.PEARL]: '明珠',
  [JadeType.GOLD]: '黄金',
};

export const INITIAL_BAG: JadeType[] = [
  ...Array(4).fill(JadeType.WHITE),
  ...Array(4).fill(JadeType.GREEN),
  ...Array(4).fill(JadeType.BLUE),
  ...Array(4).fill(JadeType.RED),
  ...Array(4).fill(JadeType.PURPLE),
  ...Array(2).fill(JadeType.PEARL),
  ...Array(3).fill(JadeType.GOLD),
];

const t1: JadeCard[] = [
    { id: 't1-1', tier: 1, points: 0, seals: 0, bonus: JadeType.PURPLE, cost: { [JadeType.RED]: 1, [JadeType.GREEN]: 1, [JadeType.BLUE]: 1, [JadeType.WHITE]: 1 }, imageUrl: '' },
    { id: 't1-2', tier: 1, points: 0, seals: 0, bonus: JadeType.RED, ability: CardAbility.EXTRA_TURN, cost: { [JadeType.PEARL]: 1, [JadeType.BLUE]: 2, [JadeType.WHITE]: 2 }, imageUrl: '' },
    { id: 't1-3', tier: 1, points: 0, seals: 0, bonus: JadeType.GREEN, ability: CardAbility.TAKE_TOKEN_SAME_COLOR, cost: { [JadeType.RED]: 2, [JadeType.GREEN]: 2 }, imageUrl: '' },
    { id: 't1-4', tier: 1, points: 1, seals: 0, bonus: JadeType.BLUE, cost: { [JadeType.GREEN]: 3, [JadeType.BLUE]: 2 }, imageUrl: '' },
    { id: 't1-5', tier: 1, points: 0, seals: 1, bonus: JadeType.WHITE, cost: { [JadeType.WHITE]: 3 }, imageUrl: '' },
    { id: 't1-6', tier: 1, points: 0, seals: 0, bonus: JadeType.PURPLE, cost: { [JadeType.WHITE]: 2, [JadeType.GREEN]: 1 }, imageUrl: '' },
    { id: 't1-j1', tier: 1, points: 1, seals: 0, bonus: undefined, ability: CardAbility.MATCH_COLOR, cost: { [JadeType.PEARL]: 1, [JadeType.PURPLE]: 4 }, imageUrl: '' },
];

const t2: JadeCard[] = [
    { id: 't2-1', tier: 2, points: 1, seals: 0, bonus: JadeType.PURPLE, ability: CardAbility.STEAL_TOKEN, cost: { [JadeType.GREEN]: 3, [JadeType.WHITE]: 4 }, imageUrl: '' },
    { id: 't2-2', tier: 2, points: 1, seals: 0, bonus: JadeType.RED, ability: CardAbility.PRIVILEGE, cost: { [JadeType.BLUE]: 2, [JadeType.WHITE]: 5 }, imageUrl: '' },
    { id: 't2-3', tier: 2, points: 2, seals: 1, bonus: JadeType.BLUE, cost: { [JadeType.PEARL]: 1, [JadeType.RED]: 2, [JadeType.GREEN]: 2, [JadeType.BLUE]: 2 }, imageUrl: '' },
    { id: 't2-4', tier: 2, points: 2, seals: 0, bonus: JadeType.GREEN, ability: CardAbility.TAKE_TOKEN_SAME_COLOR, cost: { [JadeType.BLUE]: 4, [JadeType.RED]: 2 }, imageUrl: '' },
    { id: 't2-5', tier: 2, points: 3, seals: 0, bonus: JadeType.WHITE, cost: { [JadeType.PURPLE]: 5, [JadeType.GOLD]: 1 }, imageUrl: '' },
    { id: 't2-6', tier: 2, points: 1, seals: 1, bonus: JadeType.RED, cost: { [JadeType.GREEN]: 3, [JadeType.BLUE]: 2 }, imageUrl: '' },
];

const t3: JadeCard[] = [
    { id: 't3-1', tier: 3, points: 3, seals: 2, bonus: JadeType.GREEN, cost: { [JadeType.PEARL]: 1, [JadeType.RED]: 3, [JadeType.GREEN]: 5, [JadeType.WHITE]: 3 }, imageUrl: '' },
    { id: 't3-p1', tier: 3, points: 6, seals: 0, bonus: undefined, cost: { [JadeType.WHITE]: 8 }, imageUrl: '' },
    { id: 't3-j1', tier: 3, points: 1, seals: 3, bonus: undefined, ability: CardAbility.MATCH_COLOR, cost: { [JadeType.PURPLE]: 8 }, imageUrl: '' },
    { id: 't3-2', tier: 3, points: 4, seals: 0, bonus: JadeType.BLUE, ability: CardAbility.EXTRA_TURN, cost: { [JadeType.WHITE]: 6, [JadeType.RED]: 6 }, imageUrl: '' },
];

export const INITIAL_DECKS = { tier1: t1, tier2: t2, tier3: t3 };

export const BEAUTIES: Beauty[] = [
  { id: 'b1', name: '西施', points: 2, description: '浣纱溪畔，鱼见其貌而沉底。越女传信，获赐恩旨。', ability: CardAbility.PRIVILEGE, imageUrl: '' },
  { id: 'b2', name: '王昭君', points: 3, description: '琵琶一曲，雁闻其音而落沙。远嫁塞外，万世流芳。', ability: undefined, imageUrl: '' },
  { id: 'b3', name: '貂蝉', points: 2, description: '凤仪亭前，月见其颜而隐云。巧施连环，偷香窃玉。', ability: CardAbility.STEAL_TOKEN, imageUrl: '' },
  { id: 'b4', name: '杨玉环', points: 2, description: '华清池深，花见其美而含羞。霓裳羽衣，梦回盛唐。', ability: CardAbility.EXTRA_TURN, imageUrl: '' }
];

export const SPIRAL_PATH = [
  // Center
  [2,2], 
  // Ring 1 (Down -> Right -> Up -> Left)
  [3,2], [3,3], [2,3], [1,3], [1,2], [1,1], [2,1], [3,1],
  // Ring 2 (Down -> Right -> Up -> Left)
  [4,1], [4,2], [4,3], [4,4], [3,4], [2,4], [1,4], [0,4], [0,3], [0,2], [0,1], [0,0], [1,0], [2,0], [3,0], [4,0]
];
