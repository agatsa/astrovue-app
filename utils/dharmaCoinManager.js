import { auth, db } from '../config/firebase';

import {
  doc, updateDoc, increment,
  collection, addDoc, serverTimestamp, getDoc, setDoc
} from 'firebase/firestore';



const COIN_KEY = '@wallet_dharma_coins';
const SYNC_TIMESTAMP_KEY = '@wallet_sync_timestamp';

const DharmaCoin = {
  /**
   * 🔁 Force sync Firestore → AsyncStorage and initialize if needed
   */
  async syncFromFirestore() {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return;

    const ref = doc(db, 'users', uid);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      const data = snapshot.data();
      const coins = data.wallet_dharma_coins ?? 0;
      const earned = data.wallet_dharma_earned ?? 0;
      const spent = data.wallet_dharma_spent ?? 0;

      // 🔧 Auto-heal missing fields
      const updates = {};
      if (data.wallet_dharma_coins === undefined) updates.wallet_dharma_coins = 0;
      if (data.wallet_dharma_earned === undefined) updates.wallet_dharma_earned = 0;
      if (data.wallet_dharma_spent === undefined) updates.wallet_dharma_spent = 0;
      if (Object.keys(updates).length > 0) await updateDoc(ref, updates);

      await AsyncStorage.setItem(COIN_KEY, coins.toString());
      await AsyncStorage.setItem(SYNC_TIMESTAMP_KEY, Date.now().toString());
      return coins;
    } else {
      // 👶 If user doc somehow doesn't exist
      await setDoc(ref, {
        wallet_dharma_coins: 0,
        wallet_dharma_earned: 0,
        wallet_dharma_spent: 0,
      });
      await AsyncStorage.setItem(COIN_KEY, '0');
      await AsyncStorage.setItem(SYNC_TIMESTAMP_KEY, Date.now().toString());
      return 0;
    }
  },

  /**
   * 💰 Get balance (auto-sync daily or first launch)
   */
  async getBalance() {
    const lastSyncStr = await AsyncStorage.getItem(SYNC_TIMESTAMP_KEY);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr) : 0;
    const now = Date.now();

    if (now - lastSync > 24 * 60 * 60 * 1000 || !lastSync) {
      return await this.syncFromFirestore();
    }

    const stored = await AsyncStorage.getItem(COIN_KEY);
    return parseInt(stored || '0');
  },

  /**
   * ➕ Add coins (earn)
   */
  async addCoins(amount, reason = 'Earned') {
    try {
      const uid = auth.currentUser?.uid;
      console.log('🪪 UID for addCoins:', uid);
  
      if (!uid || !amount) {
        console.log('⚠️ UID or amount missing.');
        return;
      }
  
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        console.log('📄 Creating new user doc with wallet fields...');
        await setDoc(userRef, {
          wallet_dharma_coins: amount,
          wallet_dharma_earned: amount,
        }, { merge: true });
      } else {
        console.log('✏️ Updating existing user wallet fields...');
        await updateDoc(userRef, {
          wallet_dharma_coins: increment(amount),
          wallet_dharma_earned: increment(amount),
        });
      }
  
      // Add transaction to subcollection
      const txRef = collection(userRef, 'wallet_transactions');
      await addDoc(txRef, {
        type: 'Earned',
        reason,
        amount,
        coins: amount,
        timestamp: serverTimestamp(),
      });
  
      // Update AsyncStorage cache
      const coins = await this.syncFromFirestore();
      console.log('✅ Coins added and synced:', coins);
      return coins;
  
    } catch (error) {
      console.log('❌ Error in addCoins():', error);
    }
  },
  
  

  /**
   * ➖ Spend coins (use)
   */
  async spendCoins(amount, reason = 'Spent') {
    const uid = getAuth().currentUser?.uid;
    if (!uid || !amount) return;

    const ref = doc(db, 'users', uid);

    await updateDoc(ref, {
      wallet_dharma_coins: increment(-amount),
      wallet_dharma_spent: increment(amount),
    });

    await addDoc(collection(ref, 'wallet_transactions'), {
      type: 'Spent',
      reason,
      amount,
      coins: -amount,
      timestamp: serverTimestamp(),
    });

    return await this.syncFromFirestore();
  },

  /**
   * 📜 Fetch last N transactions
   */
  async getTransactionHistory(limitCount = 30) {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return [];

    const ref = doc(db, 'users', uid);
    const txRef = collection(ref, 'wallet_transactions');

    const q = query(txRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  },

  /**
   * 📊 Get summary (earned, spent)
   */
  async getSummary() {
    const uid = getAuth().currentUser?.uid;
    if (!uid) return { earned: 0, spent: 0 };

    const ref = doc(db, 'users', uid);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        earned: data.wallet_dharma_earned ?? 0,
        spent: data.wallet_dharma_spent ?? 0,
      };
    }

    return { earned: 0, spent: 0 };
  },
};

export default DharmaCoin;
