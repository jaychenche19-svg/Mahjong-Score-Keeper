import { useState } from 'react';
import { Calculator, Trophy, Crown } from 'lucide-react';

const TABS = [
  { id: 'score',  Icon: Calculator },
  { id: 'status', Icon: Trophy },
  { id: 'result', Icon: Crown },
] as const;

interface Props {
  activeTab: string;
  onTabChange: (id: string) => void;
  hapticClick: () => void;
}

export function TabBar({ activeTab, onTabChange, hapticClick }: Props) {
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[82%] max-w-xs z-50 rounded-[2.2rem] ios-glass-bar p-2 flex gap-2">
      {TABS.map(({ id, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            onTouchStart={() => setPressedBtn(id)}
            onTouchEnd={() => { setPressedBtn(null); hapticClick(); onTabChange(id); }}
            onClick={() => { hapticClick(); onTabChange(id); }}
            className={`ios-glass-tab flex-1 h-14 rounded-[1.6rem] flex items-center justify-center
              ${isActive ? 'ios-glass-tab-active text-gray-900' : 'text-gray-400'}`}
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
