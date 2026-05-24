import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { BASE_URL } from './config/constants';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/FontAwesome';
import { UserChartProvider } from './screens/UserChartContext';

import ResetScreen from './screens/ResetScreen'; // adjust path as needed
import PhoneLoginScreen from './screens/PhoneLoginScreen';
import OtpVerifyScreen from './screens/OtpVerifyScreen';

import WalletScreen from './screens/WalletScreen';
import TransactionHistoryScreen from './screens/TransactionHistoryScreen';
import Ionicons from 'react-native-vector-icons/Ionicons';



// 📱 Main App Screens
import HomeScreen from './screens/HomeScreen';
import KundliScreen from './screens/KundliScreen';
import AstroFitnessScreen from './screens/AstroFitnessScreen';
import AstroConnectScreen from './screens/AstroConnectScreen';
import AstroAlertScreen from './screens/AstroAlertScreen';
import AstroNavScreen from './screens/AstroNavScreen';
import CompatibilityScreen from './screens/CompatibilityScreen';
import AstroShopScreen from './screens/AstroShopScreen';
import AstroEssenceScreen from './screens/AstroEssenceScreen';
import AstroLoveScreen from './screens/AstroLoveScreen';
import AstroCareerScreen from './screens/AstroCareerScreen';
import AstroCircleScreen from './screens/AstroCircleScreen';
import AstroBondScreen from './screens/AstroBondScreen';
import AstroMoneyScreen from './screens/AstroMoneyScreen';
import AstroSocial from './screens/AstroSocial';
import CelestialPulseScreen from './screens/CelestialPulseScreen';
import HourlyRiskMeterScreen from './screens/HourlyRiskMeterScreen';
import SocialWall from './screens/Socialwall';
import EditProfileScreen from './screens/EditProfileScreen';
import DharmaRechargeScreen from './screens/DharmaRechargeScreen';
import DharmaPaymentWebView from './screens/DharmaPaymentWebView';
import FontAwesome from 'react-native-vector-icons/FontAwesome';




// 📝 Signup Screens
import Step1NameScreen from './screens/signup/Step1NameScreen';
import Step2DobScreen from './screens/signup/Step2DobScreen';
import Step3TobScreen from './screens/signup/Step3TobScreen';
import Step4PobScreen from './screens/signup/Step4PobScreen';
import Step5EmailScreen from './screens/signup/Step5EmailScreen';
import Step6PhotoScreen from './screens/signup/Step6PhotoScreen';
import Step7ConfirmScreen from './screens/signup/Step7ConfirmScreen';


import SettingsScreen from './screens/SettingsScreen';
import VastuScannerScreen from './screens/VastuScannerScreen';
import CosmicHomeScreen from './screens/CosmicHomeScreen';
import AiJyotishScreen from './screens/AiJyotishScreen';
import MuhuratScreen from './screens/MuhuratScreen';
import RelationshipCosmosScreen from './screens/RelationshipCosmosScreen';
import HealthRhythmScreen from './screens/HealthRhythmScreen';
import NakshatraCommunityScreen from './screens/NakshatraCommunityScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import SocialFeedScreen from './screens/social/SocialFeedScreen';
import JyotishProfileUnlockScreen from './screens/social/JyotishProfileUnlockScreen';
import CreatePostScreen from './screens/social/CreatePostScreen';
import UserSearchScreen from './screens/social/UserSearchScreen';
import UserProfileScreen from './screens/social/UserProfileScreen';
import FollowListScreen from './screens/social/FollowListScreen';
import PostDetailScreen from './screens/social/PostDetailScreen';
import BookingScreen from './screens/social/BookingScreen';
import ProviderDashboardScreen from './screens/social/ProviderDashboardScreen';
import UserBookingsScreen from './screens/social/UserBookingsScreen';
import { LinearGradient } from 'expo-linear-gradient';
import { Text as RNText } from 'react-native';
import { colors } from './config/theme';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* New 8-pillar screens */}
      <Stack.Screen name="CosmicHome"          component={CosmicHomeScreen} />
      <Stack.Screen name="AiJyotish"           component={AiJyotishScreen} />
      <Stack.Screen name="MuhuratScreen"       component={MuhuratScreen} />
      <Stack.Screen name="RelationshipCosmos"  component={RelationshipCosmosScreen} />
      <Stack.Screen name="HealthRhythm"        component={HealthRhythmScreen} />
      <Stack.Screen name="NakshatraCommunity"  component={NakshatraCommunityScreen} />
      <Stack.Screen name="VastuScanner"        component={VastuScannerScreen} />

      {/* Legacy screens — all preserved */}
      <Stack.Screen name="HomeMain"            component={HomeScreen} options={{ headerShown: true, title: 'Home' }} />
      <Stack.Screen name="AstroAlert"          component={AstroAlertScreen} />
      <Stack.Screen name="AstroNav"            component={AstroNavScreen} />
      <Stack.Screen name="AstroFitness"        component={AstroFitnessScreen} />
      <Stack.Screen name="Compatibility"       component={CompatibilityScreen} />
      <Stack.Screen name="AstroConnect"        component={AstroConnectScreen} />
      <Stack.Screen name="AstroShop"           component={AstroShopScreen} />
      <Stack.Screen name="AstroEssence"        component={AstroEssenceScreen} />
      <Stack.Screen name="AstroLove"           component={AstroLoveScreen} />
      <Stack.Screen name="AstroCareer"         component={AstroCareerScreen} />
      <Stack.Screen name="AstroCircle"         component={AstroCircleScreen} />
      <Stack.Screen name="AstroBond"           component={AstroBondScreen} />
      <Stack.Screen name="AstroMoney"          component={AstroMoneyScreen} />
      <Stack.Screen name="AstroSocial"         component={AstroSocial} />
      <Stack.Screen name="CelestialPulse"      component={CelestialPulseScreen} />
      <Stack.Screen name="HourlyRisk"          component={HourlyRiskMeterScreen} />
      <Stack.Screen name="Reset"               component={ResetScreen} />
      <Stack.Screen name="EditProfile"         component={EditProfileScreen} />
      <Stack.Screen name="DharmaRecharge"      component={DharmaRechargeScreen} />
      <Stack.Screen name="WalletScreen"        component={WalletScreen} />
      <Stack.Screen name="TransactionHistory"  component={TransactionHistoryScreen} />
      <Stack.Screen name="DharmaPaymentWebView"component={DharmaPaymentWebView} />
      <Stack.Screen name="RhythmBand"          component={ResetScreen} />
    </Stack.Navigator>
  );
}

// New 5-tab navigator
function NewMainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   '#F4B942',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        tabBarStyle: {
          backgroundColor: '#0D0829',
          borderTopWidth:  1,
          borderTopColor:  'rgba(244,185,66,0.2)',
          height:          68,
          paddingBottom:   10,
          paddingTop:      8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarIcon: ({ color, focused }) => {
          const icons = {
            Today:       '☀',
            Social:      '◎',
            'Ask Astro': '✦',
            Discover:    '⊕',
            More:        '≡',
          };
          return (
            <RNText style={{ fontSize: focused ? 26 : 22, color, lineHeight: 28, includeFontPadding: false }}>
              {icons[route.name]}
            </RNText>
          );
        },
      })}
    >
      <Tab.Screen name="Today"     component={CosmicHomeScreen} />
      <Tab.Screen name="Social"    component={SocialFeedScreen} />
      <Tab.Screen name="Ask Astro" component={AiJyotishScreen} />
      <Tab.Screen name="Discover"  component={DiscoverScreen} />
      <Tab.Screen name="More"      component={SettingsScreen} />
    </Tab.Navigator>
  );
}

// Legacy stack (kept as fallback)
function HomeStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain"      component={HomeScreen}          options={{ title: 'Home' }} />
      <Stack.Screen name="AstroAlert"    component={AstroAlertScreen} />
      <Stack.Screen name="Compatibility" component={CompatibilityScreen} />
      <Stack.Screen name="AstroCareer"   component={AstroCareerScreen} />
      <Stack.Screen name="AstroMoney"    component={AstroMoneyScreen} />
      <Stack.Screen name="CelestialPulse"component={CelestialPulseScreen}/>
      <Stack.Screen name="HourlyRisk"    component={HourlyRiskMeterScreen}/>
      <Stack.Screen name="EditProfile"   component={EditProfileScreen} />
      <Stack.Screen name="VastuScanner"  component={VastuScannerScreen}  options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function SignupStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PhoneLoginScreen" component={PhoneLoginScreen} />
      <Stack.Screen name="OtpVerifyScreen" component={OtpVerifyScreen} />
      <Stack.Screen name="Step1Name" component={Step1NameScreen} />
      <Stack.Screen name="Step2Dob" component={Step2DobScreen} />
      <Stack.Screen name="Step3Tob" component={Step3TobScreen} />
      <Stack.Screen name="Step4Pob" component={Step4PobScreen} />
      <Stack.Screen name="Step5Email" component={Step5EmailScreen} />
      <Stack.Screen name="Step6Photo" component={Step6PhotoScreen} />
      <Stack.Screen name="Step7Confirm" component={Step7ConfirmScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);


  
  // Register push notifications
  useEffect(() => {
    (async () => {
      try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') return;
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: '41f1b53f-aacc-41ec-9e01-bb9d76936b61', // EAS project ID from app.json
        });
        const expoPushToken = tokenData.data;
        // Save to backend once user is logged in
        const saveToken = async () => {
          const user = getAuth().currentUser;
          if (!user || !expoPushToken) return;
          const idToken = await user.getIdToken();
          await fetch(`${BASE_URL}/api/save-push-token`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ expoPushToken }),
          }).catch(() => {});
        };
        // Try immediately + retry after 3s in case user just logged in
        saveToken();
        setTimeout(saveToken, 3000);

        if (Platform.OS === 'android') {
          Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
          });
        }
      } catch (e) {
        console.log('[Push] setup error:', e);
      }
    })();
  }, []);

  useEffect(() => {
    // App uses custom backend OTP auth — AsyncStorage profile is the source of truth
    const check = async () => {
      const data = await AsyncStorage.getItem('userProfile');
      setHasProfile(!!data);
      setIsLoading(false);
    };
    check();

    // Poll every 2s so the screen switches right after Step7 saves the profile
    const interval = setInterval(async () => {
      const data = await AsyncStorage.getItem('userProfile');
      if (data) setHasProfile(true);
    }, 2000);

    return () => clearInterval(interval);
  }, []);
  
  
  


  if (isLoading) {
    return (
      <LinearGradient colors={['#080416', '#1E0A4F', '#2D0F7A']} style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <RNText style={{ fontSize: 48, marginBottom: 16 }}>🪐</RNText>
        <RNText style={{ color: '#F4B942', fontSize: 24, fontWeight: '800' }}>Cosmiq</RNText>
        <ActivityIndicator size="large" color="#F4B942" style={{ marginTop: 24 }} />
      </LinearGradient>
    );
  }

  return (
    <SafeAreaProvider>
    <UserChartProvider>
      <StatusBar translucent={false} backgroundColor="#000000" barStyle="light-content" />
      <NavigationContainer>
        {hasProfile ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainTabs" component={NewMainTabs} />
            {/* All screens accessible from anywhere */}
            <Stack.Screen name="AiJyotish"            component={AiJyotishScreen} />
            <Stack.Screen name="SocialFeed"           component={SocialFeedScreen} />
            <Stack.Screen name="SocialProfile"        component={JyotishProfileUnlockScreen} />
            <Stack.Screen name="JyotishProfileUnlock" component={JyotishProfileUnlockScreen} />
            <Stack.Screen name="CreatePost"           component={CreatePostScreen} />
            <Stack.Screen name="UserSearch"           component={UserSearchScreen} />
            <Stack.Screen name="UserProfile"          component={UserProfileScreen} />
            <Stack.Screen name="FollowList"           component={FollowListScreen} />
            <Stack.Screen name="PostDetail"           component={PostDetailScreen} />
            <Stack.Screen name="BookingScreen"        component={BookingScreen} />
            <Stack.Screen name="ProviderDashboard"    component={ProviderDashboardScreen} />
            <Stack.Screen name="UserBookings"         component={UserBookingsScreen} />
            <Stack.Screen name="MuhuratScreen"        component={MuhuratScreen} />
            <Stack.Screen name="RelationshipCosmos"  component={RelationshipCosmosScreen} />
            <Stack.Screen name="HealthRhythm"        component={HealthRhythmScreen} />
            <Stack.Screen name="NakshatraCommunity"  component={NakshatraCommunityScreen} />
            <Stack.Screen name="VastuScanner"        component={VastuScannerScreen} />
            <Stack.Screen name="AstroBond"           component={AstroBondScreen} />
            <Stack.Screen name="EditProfile"         component={EditProfileScreen} />
            <Stack.Screen name="DharmaRecharge"      component={DharmaRechargeScreen} />
            <Stack.Screen name="WalletScreen"        component={WalletScreen} />
            <Stack.Screen name="TransactionHistory"  component={TransactionHistoryScreen} />
            <Stack.Screen name="DharmaPaymentWebView"component={DharmaPaymentWebView} />
            <Stack.Screen name="CelestialPulse"      component={CelestialPulseScreen} />
            <Stack.Screen name="HourlyRisk"          component={HourlyRiskMeterScreen} />
            <Stack.Screen name="AstroCareer"         component={AstroCareerScreen} />
            <Stack.Screen name="AstroMoney"          component={AstroMoneyScreen} />
            <Stack.Screen name="AstroAlert"          component={AstroAlertScreen} />
            <Stack.Screen name="Compatibility"       component={CompatibilityScreen} />
            <Stack.Screen name="AstroLove"           component={AstroLoveScreen} />
            <Stack.Screen name="Reset"               component={ResetScreen} />
            <Stack.Screen name="Kundli"              component={KundliScreen} />
            <Stack.Screen name="HomeMain"            component={HomeScreen} options={{ headerShown: true }} />
          </Stack.Navigator>
        
        ) : (
          <SignupStackScreen />
        )}
      </NavigationContainer>
    </UserChartProvider>
    </SafeAreaProvider>
  );
}
