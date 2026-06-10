import { useState } from 'react';

export function useHaptic() {
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const hapticClick = () => {
    if (vibrationEnabled && typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
  };

  const hapticSlide = () => {
    if (vibrationEnabled && typeof window !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  };

  return { vibrationEnabled, setVibrationEnabled, hapticClick, hapticSlide };
}
