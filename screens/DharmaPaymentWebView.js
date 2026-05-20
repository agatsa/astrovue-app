import { BASE_URL } from "../config/constants";
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';

export default function DharmaPaymentWebView({ route, navigation }) {
  const { amount, coins } = route.params;
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCheckoutUrl = async () => {
      try {
        const user = getAuth().currentUser;
        const token = await user.getIdToken();

        const res = await fetch('${BASE_URL}/api/create-razorpay-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
        });

        const data = await res.json();

        if (data.id) {
          const redirectUrl = `https://checkout.razorpay.com/v1/checkout.js?order_id=${data.id}`;
          setCheckoutUrl(redirectUrl);
        } else {
          Alert.alert('Error', 'Failed to create Razorpay order');
          navigation.goBack();
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Could not load Razorpay checkout');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutUrl();
  }, []);

  const handleNavChange = async ({ url }) => {
    if (url.includes('razorpay.com/success')) {
      const paymentId = new URL(url).searchParams.get('payment_id');
      if (!paymentId) return;

      try {
        const user = getAuth().currentUser;
        const token = await user.getIdToken();

        await fetch('${BASE_URL}/api/recharge-success', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ coins, amount, payment_id: paymentId }),
        });

        Alert.alert('✅ Success', `${coins} Dharma Coins added to your wallet.`);
        navigation.navigate('WalletScreen');
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Payment succeeded but wallet update failed. Contact support.');
        navigation.navigate('WalletScreen');
      }
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#d4a200" />
      </SafeAreaView>
    );
  }

  return (
    <WebView
      source={{ uri: checkoutUrl }}
      onNavigationStateChange={handleNavChange}
      startInLoadingState
    />
  );
}
