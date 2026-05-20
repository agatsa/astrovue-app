import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { auth } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

import { getAuth, signOut } from 'firebase/auth';





export default function SettingsScreen() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    const auth = getAuth();
    const navigation = useNavigation();
  
    try {
      // 🔒 Sign out from Firebase Auth
      await signOut(auth);
  
      // 🧹 Clear AsyncStorage keys
      await AsyncStorage.removeItem('@user_profile');
      await AsyncStorage.removeItem('@wallet_dharma_coins');
      await AsyncStorage.removeItem('@daily_energy');
      await AsyncStorage.removeItem('@streak_tracker');
      await AsyncStorage.removeItem('@ai_chat_history');
  
      // Optional: clear all keys (if safe)
      await AsyncStorage.clear();
  
      // 🧭 Reset to Signup/Login flow
      navigation.reset({
        index: 0,
        routes: [{ name: 'SignupStack' }], // 👈 Ensure this matches your entry stack name
      });
  
      Alert.alert('✅ Logged Out', 'You have been signed out successfully.');
  
    } catch (error) {
      console.error('❌ Logout failed:', error);
      Alert.alert('Logout Failed', 'Something went wrong. Please try again.');
    }
  };

  const SettingItem = ({ label, onPress, color = '#333' }) => (
    <TouchableOpacity style={styles.option} onPress={onPress}>
      <Text style={[styles.optionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.header}>⚙️ Settings</Text>

        {/* Account */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Account</Text>
          <SettingItem label="📝 Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <SettingItem label="🪙 Dharma Wallet" onPress={() => navigation.navigate('WalletScreen')} />
          <SettingItem label="📅 My Bookings" onPress={() => navigation.navigate('UserBookings')} />
          <SettingItem label="📊 Provider Dashboard" onPress={() => navigation.navigate('ProviderDashboard')} />
          <SettingItem
            label="🚪 Logout"
            color="red"
            onPress={() => {
                Alert.alert(
                'Confirm Logout',
                'Are you sure you want to log out?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Logout', onPress: handleLogout },
                ],
                { cancelable: true }
                );
            }}
            />

          <SettingItem label="🗑️ Delete Account" onPress={() => Alert.alert("Contact support to delete your account.")} />
        </View>

        {/* App Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧩 App Preferences</Text>
          <SettingItem label="🌓 Theme: Light/Dark" onPress={() => Alert.alert("Coming soon!")} />
          <SettingItem label="🌐 Language Preferences" onPress={() => Alert.alert("Coming soon!")} />
          <SettingItem label="🔔 Notification Settings" onPress={() => navigation.navigate('NotificationSettings')} />
          <SettingItem label="📍 Location Permissions" onPress={() => Alert.alert("Change this in system settings")} />
        </View>

        {/* Dharma Coins */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🪙 Dharma Coins</Text>
          <SettingItem label="💰 View Balance & Wallet" onPress={() => navigation.navigate('WalletScreen')} />
          <SettingItem label="🛍️ Recharge Dharma Coins" onPress={() => navigation.navigate('DharmaRecharge')} />
          <SettingItem label="📜 Transaction History" onPress={() => navigation.navigate('TransactionHistory')} />
        </View>

        {/* Astrology */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌠 Astrology Settings</Text>
          <SettingItem label="🌙 Default Dasha System" onPress={() => Alert.alert("Vimshottari is default")} />
          <SettingItem label="🧭 Preferred Chart Style" onPress={() => Alert.alert("South/North Indian view switch coming soon!")} />
          <SettingItem label="🔄 Daily Scan Time" onPress={() => Alert.alert("Auto scan scheduled at 6 AM")} />
        </View>

        {/* Social */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 Social & Connections</Text>
          <SettingItem label="🔗 Manage AstroCircle" onPress={() => navigation.navigate('AstroCircleScreen')} />
          <SettingItem label="⏳ Blocked Users" onPress={() => Alert.alert("Coming soon")} />
          <SettingItem label="📸 Linked Social Accounts" onPress={() => Alert.alert("Instagram & Facebook linking coming soon")} />
        </View>

        {/* AI */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🧠 AI & Privacy</Text>
          <SettingItem label="🤖 AstroAI History" onPress={() => navigation.navigate('AskAstroAIScreen')} />
          <SettingItem label="🧽 Clear AI Data" onPress={() => Alert.alert("Clear AI chat logs?")} />
          <SettingItem label="📂 Data Sharing Consent" onPress={() => Alert.alert("Adjust privacy settings")} />
          <SettingItem label="📜 Terms & Conditions" onPress={() => navigation.navigate('WebViewScreen', { url: 'https://kundlisutra.com/terms' })} />
          <SettingItem label="🔒 Privacy Policy" onPress={() => navigation.navigate('WebViewScreen', { url: 'https://kundlisutra.com/privacy' })} />
        </View>

        {/* Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>ℹ️ App Info & Support</Text>
          <SettingItem label="📱 App Version: 1.0.0" onPress={() => {}} />
          <SettingItem label="📬 Contact Support" onPress={() => Alert.alert("support@kundlisutra.com")} />
          <SettingItem label="⭐ Rate the App" onPress={() => Alert.alert("Redirect to Play Store soon")} />
          <SettingItem label="🧪 Join Beta Program" onPress={() => Alert.alert("Coming soon!")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fefefe',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 15,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  option: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  optionText: {
    fontSize: 16,
  },
});
