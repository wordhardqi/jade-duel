
import React, { useState, useEffect, useMemo } from 'react';
import { JadeType, GameState, JadeCard, Player, CardAbility, Beauty } from './types';
import { JADE_COLORS, CARD_THEMES, JADE_LABELS, INITIAL_DECKS, INITIAL_BAG, BEAUTIES, SPIRAL_PATH } from './constants';

const ABILITY_ICONS: Record<string, string> = {
    [CardAbility.EXTRA_TURN]: 'fa-redo',
    [CardAbility.PRIVILEGE]: 'fa-scroll',
    [CardAbility.STEAL_TOKEN]: 'fa-hand-sparkles',
    [CardAbility.TAKE_TOKEN_SAME_COLOR]: 'fa-plus-circle',
    [CardAbility.MATCH_COLOR]: 'fa-magic',
};

const ABILITY_LABELS: Record<string, string> = {
    [CardAbility.EXTRA_TURN]: '再弈',
    [CardAbility.PRIVILEGE]: '旨意',
    [CardAbility.STEAL_TOKEN]: '窃玉',
    [CardAbility.TAKE_TOKEN_SAME_COLOR]: '同泽',
    [CardAbility.MATCH_COLOR]: '幻色',
};

const App: React.FC = () => {
  const [game, setGame] = useState<GameState | null>(null);
  const [hoveredBeauty, setHoveredBeauty] = useState<{ beauty: Beauty, x: number, y: number } | null>(null);
  const [invalidSelection, setInvalidSelection] = useState(false);

  useEffect(() => {
    const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
    const d1 = shuffle(INITIAL_DECKS.tier1);
    const d2 = shuffle(INITIAL_DECKS.tier2);
    const d3 = shuffle(INITIAL_DECKS.tier3);
    const bag = shuffle(INITIAL_BAG);
    const board: (JadeType | null)[][] = Array(5).fill(null).map(() => Array(5).fill(null));
    const remainingBag = [...bag];
    SPIRAL_PATH.forEach(([r, c]) => { if (remainingBag.length > 0) board[r][c] = remainingBag.pop()!; });

    const initialGame: GameState = {
      board,
      bag: remainingBag,
      market: { tier1: d1.splice(0, 5), tier2: d2.splice(0, 4), tier3: d3.splice(0, 3) },
      decks: { tier1: d1, tier2: d2, tier3: d3 },
      availableBeauties: [...BEAUTIES],
      players: [
        createPlayer(0, '博雅君子', 0),
        createPlayer(1, '风流雅士', 1),
      ],
      currentPlayerIndex: 0,
      privilegesOnBoard: 2,
      log: ['雅室初开。两袖清风，唯玉可解。'],
      selection: [],
      winner: null,
      phase: 'ACTION'
    };
    setGame(initialGame);
  }, []);

  function createPlayer(id: number, name: string, initialPrivileges: number): Player {
    return {
      id, name, score: 0, seals: 0,
      inventory: { [JadeType.WHITE]: 0, [JadeType.GREEN]: 0, [JadeType.BLUE]: 0, [JadeType.RED]: 0, [JadeType.PURPLE]: 0, [JadeType.PEARL]: 0, [JadeType.GOLD]: 0 },
      bonuses: { [JadeType.WHITE]: 0, [JadeType.GREEN]: 0, [JadeType.BLUE]: 0, [JadeType.RED]: 0, [JadeType.PURPLE]: 0, [JadeType.PEARL]: 0, [JadeType.GOLD]: 0 },
      privileges: initialPrivileges, reservedCards: [], purchasedCards: [], beauties: []
    };
  }

  const isValidSelection = (selection: {r: number, c: number}[], board: (JadeType | null)[][]): boolean => {
    if (selection.length <= 1) return true;
    const sorted = [...selection].sort((a, b) => a.r !== b.r ? a.r - b.r : a.c - b.c);
    const dr = sorted[1].r - sorted[0].r;
    const dc = sorted[1].c - sorted[0].c;
    if (Math.abs(dr) > 1 || Math.abs(dc) > 1 || (dr === 0 && dc === 0)) return false;
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].r - sorted[i-1].r !== dr || sorted[i].c - sorted[i-1].c !== dc) return false;
        if (!board[sorted[i].r][sorted[i].c]) return false;
    }
    return true;
  };

  const handleTileClick = (r: number, c: number) => {
    if (!game || game.phase !== 'ACTION') return;
    const tile = game.board[r][c];
    if (!tile || tile === JadeType.GOLD) return;
    const newSelection = [...game.selection];
    const idx = newSelection.findIndex(s => s.r === r && s.c === c);
    if (idx > -1) {
        newSelection.splice(idx, 1);
        setGame({...game, selection: newSelection});
    } else {
        if (newSelection.length >= 3) return;
        const testSelection = [...newSelection, {r, c}];
        if (isValidSelection(testSelection, game.board)) {
            setGame({...game, selection: testSelection});
            setInvalidSelection(false);
        } else {
            setInvalidSelection(true);
            setTimeout(() => setInvalidSelection(false), 400);
        }
    }
  };

  const endTurn = (state: GameState) => {
    const player = state.players[state.currentPlayerIndex];
    if (checkVictory(player)) {
        state.winner = state.currentPlayerIndex;
        setGame({ ...state });
        return;
    }
    const totalTokens = Object.values(player.inventory).reduce((a, b) => (a as number) + (b as number), 0) as number;
    if (totalTokens > 10) {
      state.phase = 'DISCARD';
      setGame({ ...state });
      return;
    }
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 2;
    state.selection = [];
    state.phase = 'ACTION';
    setGame({ ...state });
  };

  const checkVictory = (player: Player): boolean => {
    if (player.score >= 20) return true;
    if (player.seals >= 10) return true;
    const colors = [JadeType.WHITE, JadeType.GREEN, JadeType.BLUE, JadeType.RED, JadeType.PURPLE];
    for (const color of colors) {
      const colorPoints = player.purchasedCards.filter(c => c.bonus === color).reduce((sum, c) => sum + c.points, 0);
      if (colorPoints >= 10) return true;
    }
    return false;
  };

  const buyCard = (card: JadeCard, source: 'market' | 'reserve', tier?: 'tier1' | 'tier2' | 'tier3') => {
    if (!game || game.phase !== 'ACTION') return;
    const newState = { ...game };
    const player = newState.players[newState.currentPlayerIndex];
    const actualCost = { ...card.cost };
    let goldNeeded = 0;
    const payment: Record<string, number> = {};
    for (const type of Object.values(JadeType)) {
        if (type === JadeType.GOLD || type === JadeType.PEARL) continue;
        const req = (actualCost as any)[type] || 0;
        const bonus = player.bonuses[type] || 0;
        const net = Math.max(0, req - bonus);
        if (player.inventory[type] < net) {
            goldNeeded += (net - player.inventory[type]);
            payment[type] = player.inventory[type];
        } else {
            payment[type] = net;
        }
    }
    const pearlReq = actualCost[JadeType.PEARL] || 0;
    if (player.inventory[JadeType.PEARL] < pearlReq) {
        goldNeeded += (pearlReq - player.inventory[JadeType.PEARL]);
        payment[JadeType.PEARL] = player.inventory[JadeType.PEARL];
    } else {
        payment[JadeType.PEARL] = pearlReq;
    }
    if (player.inventory[JadeType.GOLD] < goldNeeded) {
        alert("玉石余额不足。");
        return;
    }
    payment[JadeType.GOLD] = goldNeeded;
    Object.entries(payment).forEach(([type, amount]) => {
        player.inventory[type as JadeType] -= amount;
        newState.bag.push(...Array(amount).fill(type));
    });
    const prevSeals = player.seals;
    player.score += card.points;
    player.seals += card.seals;
    if (card.bonus) player.bonuses[card.bonus]++;
    player.purchasedCards.push(card);
    if (source === 'market' && tier) {
        const market = newState.market[tier];
        const deck = newState.decks[tier];
        const idx = market.indexOf(card);
        if (deck.length > 0) market[idx] = deck.shift()!; else market.splice(idx, 1);
    } else {
        player.reservedCards = player.reservedCards.filter(c => c.id !== card.id);
    }
    newState.log.unshift(`${player.name} 购得一品珍玩。`);
    if (card.ability) handleImmediateAbility(newState, card.ability, card);
    if ((prevSeals < 3 && player.seals >= 3) || (prevSeals < 6 && player.seals >= 6)) {
        if (newState.availableBeauties.length > 0) newState.phase = 'PICKING_BEAUTY';
    }
    if (newState.phase === 'ACTION') endTurn(newState);
    else setGame({ ...newState });
  };

  const handleImmediateAbility = (state: GameState, ability: CardAbility, sourceCard?: JadeCard) => {
    const player = state.players[state.currentPlayerIndex];
    const opponent = state.players[(state.currentPlayerIndex + 1) % 2];
    switch (ability) {
        case CardAbility.EXTRA_TURN:
            state.log.unshift("触发能力：流连忘返（额外回合）！");
            setTimeout(() => {
                setGame(prev => {
                    if (!prev) return prev;
                    return {...prev, currentPlayerIndex: state.currentPlayerIndex};
                });
            }, 100);
            break;
        case CardAbility.PRIVILEGE:
            state.log.unshift("触发能力：获赐旨意。");
            if (state.privilegesOnBoard > 0) { player.privileges++; state.privilegesOnBoard--; }
            else if (opponent.privileges > 0) { opponent.privileges--; player.privileges++; }
            break;
        case CardAbility.STEAL_TOKEN:
            const opponentTokens = Object.keys(opponent.inventory).filter(k => k !== JadeType.GOLD && opponent.inventory[k as JadeType] > 0);
            if (opponentTokens.length > 0) {
                const stolen = opponentTokens[0] as JadeType;
                opponent.inventory[stolen]--;
                player.inventory[stolen]++;
                state.log.unshift(`触发能力：窃得 ${JADE_LABELS[stolen]}。`);
            }
            break;
    }
  };

  const selectTokens = () => {
    if (!game || game.selection.length === 0) return;
    const newState = { ...game };
    const player = newState.players[newState.currentPlayerIndex];
    newState.selection.forEach(({ r, c }) => {
      const type = newState.board[r][c]!;
      player.inventory[type]++;
      newState.board[r][c] = null;
    });
    newState.log.unshift(`${player.name} 采选了连续的玉石。`);
    endTurn(newState);
  };

  const reserveCard = (card: JadeCard, tier: 'tier1' | 'tier2' | 'tier3') => {
    if (!game || game.phase !== 'ACTION') return;
    const newState = { ...game };
    const player = newState.players[newState.currentPlayerIndex];
    let goldPos = null;
    for(let r=0; r<5; r++) for(let c=0; c<5; c++) if(newState.board[r][c] === JadeType.GOLD) goldPos = {r,c};
    if (!goldPos) { alert("阁内已无黄金，无法保留。"); return; }
    if (player.reservedCards.length >= 3) { alert("最多保留3张。"); return; }
    player.inventory[JadeType.GOLD]++;
    newState.board[goldPos.r][goldPos.c] = null;
    const market = newState.market[tier];
    const deck = newState.decks[tier];
    const idx = market.indexOf(card);
    player.reservedCards.push(card);
    if (deck.length > 0) market[idx] = deck.shift()!; else market.splice(idx, 1);
    newState.log.unshift(`${player.name} 黄金入手，珍藏卡牌。`);
    endTurn(newState);
  };

  const pickBeauty = (beauty: Beauty) => {
      if (!game || game.phase !== 'PICKING_BEAUTY') return;
      const newState = { ...game };
      const player = newState.players[newState.currentPlayerIndex];
      player.beauties.push(beauty);
      player.score += beauty.points;
      newState.availableBeauties = newState.availableBeauties.filter(b => b.id !== beauty.id);
      newState.log.unshift(`${player.name} 获佳人 ${beauty.name} 垂青。`);
      if (beauty.ability) handleImmediateAbility(newState, beauty.ability);
      newState.phase = 'ACTION';
      endTurn(newState);
  };

  if (!game) return null;

  return (
    <div className="min-h-screen pb-10">
      <header className="bg-stone-900 py-6 text-center text-amber-100 shadow-2xl border-b-4 border-amber-800/30">
        <h1 className="chinese-title text-5xl tracking-widest">玉美人 · 雅室争艳</h1>
        <p className="mt-2 text-xs opacity-50 uppercase tracking-[0.5em]">Classical Chinese Jade Duel</p>
      </header>

      <main className="mx-auto mt-8 max-w-[1400px] px-6 lg:flex lg:gap-10">
        <div className="lg:w-1/4 space-y-6">
          <PlayerCard 
            player={game.players[0]} 
            isActive={game.currentPlayerIndex === 0} 
            onBuyReserved={(card) => buyCard(card, 'reserve')}
          />
          <GameLog logs={game.log} />
        </div>

        <div className="flex-1 space-y-10">
          <div className={`relative rounded-3xl bg-stone-800/90 p-8 shadow-2xl border-2 border-stone-700/50 ice-crack ${invalidSelection ? 'invalid-shake border-red-500/50' : ''}`}>
            <div className="mb-6 flex items-center justify-between border-b border-stone-700 pb-4">
              <h2 className="chinese-title text-2xl text-amber-200">珍宝阁 <span className="text-xs font-serif opacity-50 ml-2">余: {game.bag.length}</span></h2>
              <p className="text-[10px] text-stone-500 italic">采选法则：必须采选横、竖、斜直线且相邻之玉。</p>
            </div>
            
            <div className="grid grid-cols-5 gap-4 justify-items-center">
              {game.board.map((row, r) => row.map((tile, c) => (
                <div key={`${r}-${c}`} onClick={() => handleTileClick(r, c)}
                  className={`relative flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-300
                    ${tile ? JADE_COLORS[tile] : 'border-dashed border-stone-700 bg-stone-900/30'}
                    ${game.selection.some(s => s.r === r && s.c === c) ? 'ring-4 ring-amber-400 scale-110 shadow-[0_0_20px_rgba(251,191,36,0.6)]' : ''}
                  `}>
                  {tile && <span className="text-sm font-bold">{tile === JadeType.GOLD ? <i className="fa-solid fa-coins text-xl text-amber-300"></i> : JADE_LABELS[tile]}</span>}
                </div>
              )))}
            </div>

            {game.selection.length > 0 && (
              <div className="mt-8 flex justify-center">
                <button onClick={selectTokens} className="rounded-sm bg-amber-600 px-12 py-3 text-lg chinese-title text-amber-950 shadow-2xl hover:bg-amber-500 transition-all">
                  采选珍石 ({game.selection.length})
                </button>
              </div>
            )}
          </div>

          {/* 美人卡展示区 */}
          {game.availableBeauties.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <h3 className="mb-4 text-center flex items-center gap-6">
                    <div className="h-px bg-gradient-to-r from-transparent via-stone-400 to-stone-400 flex-1 opacity-20"></div>
                    <span className="chinese-title text-xl text-stone-500 tracking-widest">绝代佳人</span>
                    <div className="h-px bg-gradient-to-l from-transparent via-stone-400 to-stone-400 flex-1 opacity-20"></div>
                </h3>
                <div className="flex flex-wrap justify-center gap-6 pb-2">
                    {game.availableBeauties.map(beauty => (
                        <div 
                            key={beauty.id}
                            onMouseEnter={(e) => setHoveredBeauty({ beauty, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setHoveredBeauty(null)}
                            className="cursor-help"
                        >
                            <BeautyCard beauty={beauty} />
                        </div>
                    ))}
                </div>
            </div>
          )}

          <div className="space-y-12">
            <Market title="上品 · 旷世重器" cards={game.market.tier3} onBuy={(c) => buyCard(c, 'market', 'tier3')} onReserve={(c) => reserveCard(c, 'tier3')} player={game.players[game.currentPlayerIndex]} />
            <Market title="中品 · 琳琅佳品" cards={game.market.tier2} onBuy={(c) => buyCard(c, 'market', 'tier2')} onReserve={(c) => reserveCard(c, 'tier2')} player={game.players[game.currentPlayerIndex]} />
            <Market title="下品 · 璞玉待琢" cards={game.market.tier1} onBuy={(c) => buyCard(c, 'market', 'tier1')} onReserve={(c) => reserveCard(c, 'tier1')} player={game.players[game.currentPlayerIndex]} />
          </div>
        </div>

        <div className="lg:w-1/4 space-y-6">
          <PlayerCard 
            player={game.players[1]} 
            isActive={game.currentPlayerIndex === 1}
            onBuyReserved={(card) => buyCard(card, 'reserve')}
          />
        </div>
      </main>

      {hoveredBeauty && <BeautyTooltip beauty={hoveredBeauty.beauty} x={hoveredBeauty.x} y={hoveredBeauty.y} />}
    </div>
  );
};

// 新增：美人卡组件
const BeautyCard: React.FC<{ beauty: Beauty }> = ({ beauty }) => (
    <div className="relative h-36 w-24 bg-stone-100/90 border-2 border-stone-300 shadow-[0_4px_10px_rgba(0,0,0,0.1)] flex flex-col items-center p-2 group hover:scale-105 hover:border-amber-400 hover:shadow-amber-500/20 transition-all duration-300 rounded-sm">
        <div className="absolute inset-0 border border-stone-200 m-1 pointer-events-none"></div>
        <div className="text-2xl chinese-title text-amber-700 mb-1 font-bold">{beauty.points}</div>
        <div className="flex-1 flex items-center justify-center w-full bg-stone-200/30 my-1 border-y border-stone-200">
            <span className="chinese-title text-lg writing-vertical-rl text-stone-800 tracking-widest font-bold py-2">{beauty.name}</span>
        </div>
        {beauty.ability ? (
            <i className={`fa-solid ${ABILITY_ICONS[beauty.ability]} text-xs text-stone-500 mt-1`}></i>
        ) : (
            <div className="h-4"></div>
        )}
    </div>
);

const MarketCard: React.FC<{ card: JadeCard; onBuy: () => void; onReserve: () => void; player: Player }> = ({ card, onBuy, onReserve, player }) => {
  const theme = card.bonus ? CARD_THEMES[card.bonus] : CARD_THEMES.DEFAULT;
  const isWhite = card.bonus === JadeType.WHITE;
  
  const canAfford = () => {
    let goldNeeded = 0;
    for (const [type, req] of Object.entries(card.cost)) {
        const bonus = player.bonuses[type as JadeType] || 0;
        const net = Math.max(0, (req as number) - bonus);
        if (player.inventory[type as JadeType] < net) goldNeeded += (net - player.inventory[type as JadeType]);
    }
    return player.inventory[JadeType.GOLD] >= goldNeeded;
  };

  const isAffordable = canAfford();

  return (
    <div 
        className={`relative h-72 w-52 flex-shrink-0 rounded-none shadow-2xl transition-all hover:-translate-y-2 group jade-surface ${isWhite ? 'glassy-white' : ''}`}
        style={{ 
            backgroundColor: theme.bg, 
            borderColor: theme.accent, 
            borderWidth: '2px',
            borderTopWidth: '14px'
        }}
    >
      <div className="absolute inset-0 crack-overlay opacity-25 pointer-events-none" style={{ '--crack-color': theme.crack } as any}></div>
      
      <div className="relative z-10 p-4 h-full flex flex-col">
        <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1.5">
                {Array.from({length: card.seals}).map((_, i) => (
                    <div key={i} className="seal-red h-8 w-5 flex items-center justify-center text-[9px] font-bold leading-none tracking-tighter">御宝</div>
                ))}
                {card.ability && (
                    <div className="ability-badge h-11 w-11 rounded-full flex flex-col items-center justify-center border-2 border-amber-900/20">
                        <i className={`fa-solid ${ABILITY_ICONS[card.ability]} text-[10px]`}></i>
                        <span className="text-[6px] font-black uppercase mt-0.5">{ABILITY_LABELS[card.ability]}</span>
                    </div>
                )}
            </div>
            
            {card.bonus && (
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs font-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-black/10 ${JADE_COLORS[card.bonus]}`}>
                    {JADE_LABELS[card.bonus][0]}
                </div>
            )}
            {!card.bonus && card.ability === CardAbility.MATCH_COLOR && (
                <div className="h-10 w-10 rounded-full bg-stone-800 text-amber-200 flex items-center justify-center text-[10px] font-bold border-2 border-amber-600/30 shadow-lg">幻色</div>
            )}
        </div>

        <div className="flex-1 flex items-center justify-center py-2 relative">
            <div className="diffraction-glow" style={{ '--glow-color': theme.glow } as any}>
                <span className="chinese-title text-8xl carved-text" style={{ color: theme.text }}>
                    {card.points || ''}
                </span>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-px bg-current opacity-10" style={{ color: theme.text }}></div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-auto border-t pt-4 border-black/[0.04]">
            {Object.entries(card.cost).map(([type, amount]) => {
                const bonus = player.bonuses[type as JadeType] || 0;
                const net = Math.max(0, (amount as number) - bonus);
                if (amount === 0) return null;
                return (
                    <div key={type} className="flex items-center gap-2 bg-stone-900/[0.05] rounded-full pl-1 pr-2.5 py-1 border border-black/[0.03] shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all group-hover:bg-stone-900/[0.08]">
                        <div className={`h-3.5 w-3.5 rounded-full ${JADE_COLORS[type as JadeType]} shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] border border-black/10`}></div>
                        <span className={`text-[12px] font-black leading-none ${net <= 0 ? 'text-emerald-700 line-through opacity-25' : 'text-stone-900'}`}>
                            {net}
                        </span>
                    </div>
                );
            })}
        </div>
      </div>

      <div className="absolute inset-0 bg-stone-900/90 backdrop-blur-md transition-all duration-300 flex flex-col items-center justify-center gap-5 opacity-0 group-hover:opacity-100 p-8 z-20">
          <button 
              onClick={(e) => { e.stopPropagation(); onBuy(); }} 
              disabled={!isAffordable} 
              className="w-full bg-amber-600 text-amber-950 chinese-title text-2xl py-3 shadow-2xl disabled:bg-stone-800 disabled:text-stone-600 transition-all hover:bg-amber-500 hover:scale-105 active:scale-95"
          >
              换取此物
          </button>
          <button 
              onClick={(e) => { e.stopPropagation(); onReserve(); }} 
              className="w-full bg-transparent text-stone-300 chinese-title text-xl py-2 border-b border-stone-700 transition-all hover:text-white hover:border-amber-600"
          >
              暂且珍藏
          </button>
      </div>
    </div>
  );
};

const Market: React.FC<{ title: string; cards: JadeCard[]; onBuy: (c: JadeCard) => void; onReserve: (c: JadeCard) => void; player: Player }> = ({ title, cards, onBuy, onReserve, player }) => (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <h3 className="mb-8 text-center flex items-center gap-6">
      <div className="h-px bg-gradient-to-r from-transparent via-stone-400 to-stone-400 flex-1 opacity-20"></div>
      <span className="chinese-title text-2xl text-stone-500 tracking-widest">{title}</span>
      <div className="h-px bg-gradient-to-l from-transparent via-stone-400 to-stone-400 flex-1 opacity-20"></div>
    </h3>
    <div className="flex gap-8 overflow-x-auto pb-10 px-2 scrollbar-hide">
      {cards.map(card => <MarketCard key={card.id} card={card} onBuy={() => onBuy(card)} onReserve={() => onReserve(card)} player={player} />)}
    </div>
  </div>
);

// 更新：增强版保留卡组件，显示成本数值
const ReservedCardMini: React.FC<{ card: JadeCard; onBuy: () => void; player: Player; canInteract: boolean }> = ({ card, onBuy, player, canInteract }) => {
    const theme = card.bonus ? CARD_THEMES[card.bonus] : CARD_THEMES.DEFAULT;
    const isWhite = card.bonus === JadeType.WHITE;
    
    const canAfford = () => {
        let goldNeeded = 0;
        for (const [type, req] of Object.entries(card.cost)) {
            const bonus = player.bonuses[type as JadeType] || 0;
            const net = Math.max(0, (req as number) - bonus);
            if (player.inventory[type as JadeType] < net) goldNeeded += (net - player.inventory[type as JadeType]);
        }
        return player.inventory[JadeType.GOLD] >= goldNeeded;
    };

    return (
        <div 
            className={`relative w-full h-22 rounded-none border-l-4 p-3 flex flex-col justify-between group transition-all duration-300 ${isWhite ? 'glassy-white' : ''} ${canInteract && canAfford() ? 'cursor-pointer hover:bg-white/10' : ''}`}
            style={{ backgroundColor: theme.bg, borderColor: theme.accent }}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <div className="text-2xl chinese-title text-stone-800 leading-none" style={{ color: theme.text }}>{card.points || '0'}</div>
                    {card.bonus && (
                        <div className={`h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-black border border-black/10 ${JADE_COLORS[card.bonus]}`}>
                            {JADE_LABELS[card.bonus][0]}
                        </div>
                    )}
                </div>
                {card.ability && <i className={`fa-solid ${ABILITY_ICONS[card.ability]} text-xs text-stone-400 mt-1`}></i>}
            </div>

            <div className="flex flex-wrap gap-1.5 justify-end mt-2">
                {Object.entries(card.cost).map(([type, amount]) => {
                     const bonus = player.bonuses[type as JadeType] || 0;
                     const net = Math.max(0, (amount as number) - bonus);
                     if ((amount as number) === 0) return null;
                     
                     return (
                        <div key={type} className="flex items-center bg-stone-900/5 rounded-full px-1.5 py-0.5 border border-stone-900/5">
                            <div className={`h-2 w-2 rounded-full ${JADE_COLORS[type as JadeType]} mr-1 shadow-sm`}></div>
                            <span className={`text-[9px] font-bold leading-none ${net > player.inventory[type as JadeType] ? 'text-red-600' : 'text-stone-800'}`}>
                                {net}
                            </span>
                        </div>
                     )
                })}
            </div>

            {canInteract && (
                <div className="absolute inset-0 bg-stone-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all z-10">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onBuy(); }}
                        disabled={!canAfford()}
                        className="bg-amber-600 text-amber-950 text-[10px] font-bold px-4 py-1.5 rounded-sm disabled:bg-stone-700 disabled:text-stone-500 shadow-lg hover:bg-amber-500"
                    >
                        换取
                    </button>
                </div>
            )}
        </div>
    );
};

const PlayerCard: React.FC<{ player: Player; isActive: boolean; onBuyReserved: (card: JadeCard) => void }> = ({ player, isActive, onBuyReserved }) => (
  <div className={`flex flex-col gap-4 transition-all duration-500 ${isActive ? 'translate-x-2' : ''}`}>
    <div className={`rounded-none p-6 shadow-2xl transition-all duration-500 border-l-8 ${isActive ? 'bg-stone-800 border-amber-500 scale-105 ring-1 ring-amber-500/30' : 'bg-stone-900 border-stone-800 opacity-60'}`}>
      <div className="mb-6 flex items-center justify-between border-b border-stone-700/50 pb-5">
        <div>
          <h2 className={`chinese-title text-4xl ${isActive ? 'text-amber-100' : 'text-stone-500'}`}>{player.name}</h2>
          <div className="flex gap-1.5 mt-3">
              {Array.from({length: player.privileges}).map((_, i) => (
                  <i key={i} className="fa-solid fa-scroll text-amber-600 text-xs floating" style={{ animationDelay: `${i * 0.5}s` }}></i>
              ))}
              {player.privileges === 0 && <span className="text-[10px] text-stone-700 uppercase tracking-widest">无旨</span>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl chinese-title text-amber-500 tracking-tighter">{player.score}</div>
          <div className="text-[10px] text-stone-500 uppercase tracking-widest">雅量</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Object.entries(player.inventory).map(([type, count]) => (
          <div key={type} className={`flex flex-col items-center rounded-none p-2.5 border border-stone-700/50 bg-stone-950/30 transition-all ${isActive ? 'hover:bg-stone-900' : ''}`}>
            <span className="text-[10px] font-bold text-stone-600 mb-1">{JADE_LABELS[type as JadeType][0]}</span>
            <span className={`text-xl font-black ${(count as number) > 0 ? 'text-stone-200' : 'text-stone-800'}`}>{count as number}</span>
            {player.bonuses[type as JadeType] > 0 && <span className="text-[10px] text-emerald-500 font-bold">+{player.bonuses[type as JadeType]}</span>}
          </div>
        ))}
      </div>
    </div>

    {/* 保留卡显示区 */}
    {player.reservedCards.length > 0 && (
        <div className={`p-4 bg-stone-950/40 border border-stone-800/50 flex flex-col gap-2 transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-1 flex items-center gap-2">
                <i className="fa-solid fa-vault text-amber-800"></i>
                私室珍藏 ({player.reservedCards.length}/3)
            </h4>
            <div className="flex flex-col gap-2">
                {player.reservedCards.map(card => (
                    <ReservedCardMini 
                        key={card.id} 
                        card={card} 
                        onBuy={() => onBuyReserved(card)} 
                        player={player} 
                        canInteract={isActive}
                    />
                ))}
            </div>
        </div>
    )}
  </div>
);

const GameLog: React.FC<{ logs: string[] }> = ({ logs }) => (
  <div className="rounded-none bg-stone-950 p-6 text-stone-500 shadow-2xl h-80 flex flex-col border border-stone-800/50">
    <h3 className="mb-4 text-[10px] font-bold text-amber-800 border-b border-stone-900 pb-2 uppercase tracking-[0.4em]">雅室漫谈</h3>
    <div className="flex-1 overflow-y-auto text-[13px] space-y-4 font-serif leading-relaxed">
      {logs.map((log, i) => (
        <div key={i} className={`transition-all duration-500 ${i === 0 ? 'text-amber-200/90 font-bold border-l-2 border-amber-900 pl-3' : 'opacity-30'}`}>
            {log}
        </div>
      ))}
    </div>
  </div>
);

const BeautyTooltip: React.FC<{ beauty: Beauty, x: number, y: number }> = ({ beauty, x, y }) => (
    <div className="fixed z-[100] w-72 rounded-none bg-stone-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-x-8 border-stone-900 pointer-events-none animate-in fade-in zoom-in-95" style={{ left: Math.min(window.innerWidth - 320, x + 25), top: Math.max(20, y - 120) }}>
        <h4 className="chinese-title text-5xl text-stone-900 border-b-2 border-stone-200 pb-3 mb-5">{beauty.name}</h4>
        <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl chinese-title text-amber-700">{beauty.points}</span>
            <span className="text-xs text-stone-500 uppercase tracking-widest font-serif">雅值</span>
        </div>
        <p className="text-[14px] text-stone-700 leading-relaxed italic font-serif bg-stone-200/40 p-4 border border-stone-300/30">
            {beauty.description}
        </p>
    </div>
);

export default App;
