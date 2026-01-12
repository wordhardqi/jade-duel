
export enum JadeType {
  WHITE = 'WHITE',   // 和田白玉 (White)
  GREEN = 'GREEN',   // 翡翠绿 (Green)
  BLUE = 'BLUE',     // 蓝玉 (Blue)
  RED = 'RED',       // 南红玛瑙 (Red)
  PURPLE = 'PURPLE', // 紫罗兰翡翠 (Black equivalent)
  PEARL = 'PEARL',   // 明珠 (Pearl)
  GOLD = 'GOLD'      // 黄金 (Wildcard)
}

export interface Cost {
  [JadeType.WHITE]?: number;
  [JadeType.GREEN]?: number;
  [JadeType.BLUE]?: number;
  [JadeType.RED]?: number;
  [JadeType.PURPLE]?: number;
  [JadeType.PEARL]?: number;
}

export enum CardAbility {
  EXTRA_TURN = 'EXTRA_TURN', // Turn
  TAKE_TOKEN_SAME_COLOR = 'TAKE_TOKEN_SAME_COLOR', // Take 2nd Same
  MATCH_COLOR = 'MATCH_COLOR', // 1 Color (Joker)
  PRIVILEGE = 'PRIVILEGE', // Privilege
  STEAL_TOKEN = 'STEAL_TOKEN' // Steal
}

export interface JadeCard {
  id: string;
  tier: number;
  points: number;
  seals: number; 
  bonus?: JadeType;
  cost: Cost;
  ability?: CardAbility;
  imageUrl: string;
}

export interface Beauty {
  id: string;
  name: string;
  points: number;
  description: string;
  imageUrl: string;
  ability?: CardAbility;
}

export interface Player {
  id: number;
  name: string;
  score: number;
  seals: number;
  inventory: Record<JadeType, number>;
  bonuses: Record<JadeType, number>;
  privileges: number;
  reservedCards: JadeCard[];
  purchasedCards: JadeCard[];
  beauties: Beauty[];
}

export interface GameState {
  board: (JadeType | null)[][];
  bag: JadeType[];
  market: {
    tier1: JadeCard[];
    tier2: JadeCard[];
    tier3: JadeCard[];
  };
  decks: {
    tier1: JadeCard[];
    tier2: JadeCard[];
    tier3: JadeCard[];
  };
  availableBeauties: Beauty[];
  players: Player[];
  currentPlayerIndex: number;
  privilegesOnBoard: number;
  log: string[];
  selection: { r: number, c: number }[];
  winner: number | null;
  phase: 'ACTION' | 'DISCARD' | 'RESOLVING_ABILITY' | 'PICKING_BEAUTY' | 'SELECTING_BONUS_COLOR';
  activeAbility?: { type: CardAbility, card?: JadeCard };
}
