import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { UserChartProvider } from './screens/UserChartContext';

import ResetScreen from './screens/ResetScreen'; // adjust path as needed

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



// 📝 Signup Screens
import Step1NameScreen from './screens/signup/Step1NameScreen';
import Step2DobScreen from './screens/signup/Step2DobScreen';
import Step3TobScreen from './screens/signup/Step3TobScreen';
import Step4PobScreen from './screens/signup/Step4PobScreen';
import Step5EmailScreen from './screens/signup/Step5EmailScreen';
import Step6PhotoScreen from './screens/signup/Step6PhotoScreen';
import Step7ConfirmScreen from './screens/signup/Step7ConfirmScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeMain" component={HomeScreen} options={{ title: "Home" }} />
      <Stack.Screen name="AstroAlert" component={AstroAlertScreen} />
      <Stack.Screen name="AstroNav" component={AstroNavScreen} />
      <Stack.Screen name="AstroFitness" component={AstroFitnessScreen} />
      <Stack.Screen name="Compatibility" component={CompatibilityScreen} />
      <Stack.Screen name="AstroConnect" component={AstroConnectScreen} />
      <Stack.Screen name="AstroShop" component={AstroShopScreen} />
      <Stack.Screen name="AstroEssence" component={AstroEssenceScreen} />
      <Stack.Screen name="AstroLove" component={AstroLoveScreen} />
      <Stack.Screen name="AstroCareer" component={AstroCareerScreen} />
      <Stack.Screen name="AstroCircle" component={AstroCircleScreen} />
      <Stack.Screen name="AstroBond" component={AstroBondScreen} />
      <Stack.Screen name="AstroMoney" component={AstroMoneyScreen} />
      <Stack.Screen name="AstroSocial" component={AstroSocial} />
      <Stack.Screen name="CelestialPulse" component={CelestialPulseScreen} />
      <Stack.Screen name="HourlyRisk" component={HourlyRiskMeterScreen} />
      <Stack.Screen name="Reset" component={ResetScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="DharmaRecharge" component={DharmaRechargeScreen} />
    </Stack.Navigator>
  );
}

function SignupStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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


  // to be uncommented when in production - Rahul
  // useEffect(() => {
  //   const checkUserProfile = async () => {
  //     const data = await AsyncStorage.getItem('userProfile');
  //     setHasProfile(!!data);
  //     setIsLoading(false);
  //   };
  //   checkUserProfile();
  // }, []);


  useEffect(() => {
    const checkUserProfile = async () => {
      const data = await AsyncStorage.getItem('userProfile');
      setHasProfile(!!data);
      setIsLoading(false);
    };
  
    checkUserProfile();
  
    // 👀 Optional: Poll every 1 second to detect profile change after confirmation
    const interval = setInterval(checkUserProfile, 1000);
    return () => clearInterval(interval);
  }, []);
  
  


  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8844ee" />
      </View>
    );
  }

  return (
    <UserChartProvider>
      <NavigationContainer>
        {hasProfile ? (
       <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
            {() => (
              <Tab.Navigator screenOptions={{ headerShown: false }}>
                <Tab.Screen name="Home" component={HomeStackScreen} />
                <Tab.Screen name="Kundli" component={KundliScreen} />
                <Tab.Screen name="Social" component={SocialWall} />
                <Tab.Screen name="Connect" component={AstroConnectScreen} />
              </Tab.Navigator>
            )}
          </Stack.Screen>
        
          {/* 🔓 Make AstroBond globally available */}
          <Stack.Screen name="AstroBond" component={AstroBondScreen} />
        </Stack.Navigator>
        
        ) : (
          <SignupStackScreen />
        )}
      </NavigationContainer>
    </UserChartProvider>
  );
}
