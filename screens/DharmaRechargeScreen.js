// DharmaRechargeScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
// import RazorpayCheckout from 'react-native-razorpay';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COIN_RATE = 1.05; // 1 Dharma Coin = ₹1.05

const calculateCoins = (amount) => Math.floor(amount / COIN_RATE);

export default function DharmaRechargeScreen({ user, firebaseToken, setCoinBalance }) {
}


//   const [rechargeAmount, setRechargeAmount] = useState('');

//   const handleRecharge = async () => {
//     const amount = Number(rechargeAmount);
//     if (isNaN(amount) || amount < 105) {
//       Alert.alert('Minimum recharge is ₹105');
//       return;
//     }

//     const coins = calculateCoins(amount);

//     const options = {
//       description: `Recharge for ${coins} Dharma Coins`,
//       currency: 'INR',
//       key: 'RAZORPAY_KEY_ID', // Replace with your Razorpay Key ID
//       amount: amount * 100,
//       name: 'Kundli Sutra',
//       prefill: {
//         email: user.email || '',
//         contact: user.phone || '',
//         name: user.name,
//       },
//       theme: { color: '#6237a0' },
//     };

// //     RazorpayCheckout.open(options)
// //       .then(async (data) => {
// //         const res = await fetch(`https://yourdomain.com/api/verify-payment`, {
// //           method: 'POST',
// //           headers: {
// //             Authorization: `Bearer ${firebaseToken}`,
// //             'Content-Type': 'application/json',
// //           },
// //           body: JSON.stringify({
// //             payment_id: data.razorpay_payment_id,
// //             expected_amount: amount,
// //             expected_coins: coins,
// //           }),
// //         });

// //         const result = await res.json();
// //         if (result.success) {
// //           await AsyncStorage.setItem('@wallet_dharma_coins', result.newBalance.toString());
// //           setCoinBalance(result.newBalance);
// //           Alert.alert(`🎉 ${coins} Dharma Coins added!`);
// //         } else {
// //           Alert.alert('❌ Payment verification failed');
// //         }
// //       })
// //       .catch((error) => {
// //         console.error('❌ Payment error:', error);
// //         Alert.alert('Payment cancelled or failed');
// //       });
// //   };

// //   const coins = calculateCoins(Number(rechargeAmount || 0));

// //   return (
// //     <View style={styles.container}>
// //       <Text style={styles.title}>💰 Recharge Dharma Coins</Text>
// //       <TextInput
// //         placeholder="Enter amount (₹)"
// //         keyboardType="numeric"
// //         value={rechargeAmount}
// //         onChangeText={setRechargeAmount}
// //         style={styles.input}
// //       />
// //       <Text style={styles.coinsText}>You will get: {coins} Dharma Coins</Text>
// //       <TouchableOpacity style={styles.button} onPress={handleRecharge}>
// //         <Text style={styles.buttonText}>Proceed to Pay</Text>
// //       </TouchableOpacity>
// //     </View>
// //   );
// // }

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 20, justifyContent: 'center' },
//   title: { fontSize: 22, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
//   input: { borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, marginBottom: 12 },
//   coinsText: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
//   button: { backgroundColor: '#6237a0', padding: 14, borderRadius: 8 },
//   buttonText: { color: 'white', textAlign: 'center', fontWeight: '600' },
// }

// );