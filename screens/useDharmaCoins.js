// hooks/useDharmaCoins.js
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useDharmaCoins() {
  const [coins, setCoins] = useState(0);

  // Load from AsyncStorage on mount
  useEffect(() => {
    const loadCoins = async () => {
      try {
        const value = await AsyncStorage.getItem('@wallet_dharma_coins');
        setCoins(parseInt(value || '0'));
      } catch (e) {
        console.error('❌ Failed to load Dharma coins:', e);
      }
    };

    loadCoins();
  }, []);

  // Update and sync
  const updateCoins = async (newValue) => {
    try {
      setCoins(newValue);
      await AsyncStorage.setItem('@wallet_dharma_coins', newValue.toString());
    } catch (e) {
      console.error('❌ Failed to update Dharma coins:', e);
    }
  };

  // Increment/decrement helper
  const changeCoinsBy = async (delta) => {
    const newVal = coins + delta;
    await updateCoins(newVal);
  };

  return { coins, updateCoins, changeCoinsBy };
}
