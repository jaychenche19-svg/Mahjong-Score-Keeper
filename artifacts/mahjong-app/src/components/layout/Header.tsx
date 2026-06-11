interface Props {
  customNames: string[];
  myRole: number;
  roomId: string;
  isSinglePlayer: boolean;
  onLogoClick: () => void;
}

export function Header({ customNames, myRole, roomId, isSinglePlayer, onLogoClick }: Props) {
  return (
    <header className="bg-white/70 backdrop-blur-2xl sticky top-0 z-40 px-5 py-4 flex justify-between items-center border-b border-gray-100">
      <div className="flex items-center gap-2 cursor-pointer" onClick={onLogoClick}>
        <span className="text-2xl">🐶</span>
        <h2 className="text-2xl font-black text-gray-900 tracking-tighter">Mahjong Dog</h2>
      </div>
      <div className="flex items-center gap-2">
        {!isSinglePlayer && (
          <span className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {roomId}
          </span>
        )}
        <div className="px-4 py-2 bg-[#C7C7CC] rounded-full">
          <span className="text-xs font-black text-gray-900">{customNames[myRole]}</span>
        </div>
      </div>
    </header>
  );
}
