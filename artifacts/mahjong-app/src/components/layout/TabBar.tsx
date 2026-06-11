import { useRef, useState } from 'react';
import { Calculator, Trophy, Crown } from 'lucide-react';

const TABS = [
  { id: 'score', Icon: Calculator },
  { id: 'status', Icon: Trophy },
  { id: 'result', Icon: Crown },
] as const;

interface Props {
  activeTab: string;
  onTabChange: (id: string) => void;
  hapticClick: () => void;
}

export function TabBar({ activeTab, onTabChange, hapticClick }: Props) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const tabIds = TABS.map(t => t.id);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // 只有水平滑動才切換（避免垂直滾動誤觸）
    if (Math.abs(dx) > 40 && dy < 30) {
      const currentIdx = tabIds.indexOf(activeTab);
      if (dx < 0 && currentIdx < tabIds.length - 1) {
        hapticClick();
        onTabChange(tabIds[currentIdx + 1]);
      } else if (dx > 0 && currentIdx > 0) {
        hapticClick();
        onTabChange(tabIds[currentIdx - 1]);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[82%] max-w-xs z-50 rounded-[2.2rem] ios-glass-bar p-2 flex gap-2"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {TABS.map(({ id, Icon }) => {
        const isActive = activeTab === id;
        const isPressed = pressedBtn === id;
        return (
          <button
            key={id}
            onTouchStart={() => setPressedBtn(id)}
            onTouchEnd={() => {
              setPressedBtn(null);
              hapticClick();
              onTabChange(id);
            }}
            onClick={() => { hapticClick(); onTabChange(id); }}
            style={{ WebkitTapHighlightColor: 'transparent' }}
            className={`ios-glass-tab flex-1 h-14 rounded-[1.6rem] flex items-center justify-center transition-all duration-150
              ${isActive ? 'ios-glass-tab-active text-gray-900' : 'text-gray-400'}
              ${isPressed ? 'scale-90' : 'scale-100'}`}
          >
            <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
              <Icon size={24} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
