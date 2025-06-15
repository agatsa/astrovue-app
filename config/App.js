import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen';
import AstroAlertScreen from './screens/AstroAlertScreen';
import AstroNavScreen from './screens/AstroNavScreen';
import AstroFitnessScreen from './screens/AstroFitnessScreen';
import CompatibilityScreen from './screens/CompatibilityScreen';
import AstroConnectScreen from './screens/AstroConnectScreen';
import AstroShopScreen from './screens/AstroShopScreen';
import AstroEssenceScreen from './screens/AstroEssenceScreen';

import { View, Text } from 'react-native';

// Placeholder bottom tab screens
function KundliScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Kundli</Text></View>;
}
function FitnessScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Fitness</Text></View>;
}
function ConnectScreen() {
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Connect</Text></View>;
}

// Stack inside Home Tab
const HomeStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: "Home" }} />
      <HomeStack.Screen name="AstroAlert" component={AstroAlertScreen} options={{ title: "AstroAlert" }} />
      <HomeStack.Screen name="AstroNav" component={AstroNavScreen} options={{ title: "AstroNav" }} />
      <HomeStack.Screen name="AstroFitness" component={AstroFitnessScreen} options={{ title: "AstroFitness" }} />
      <HomeStack.Screen name="Compatibility" component={CompatibilityScreen} options={{ title: "Compatibility" }} />
      <HomeStack.Screen name="AstroConnect" component={AstroConnectScreen} options={{ title: "AstroConnect" }} />
      <HomeStack.Screen name="AstroShop" component={AstroShopScreen} options={{ title: "AstroShop" }} />
      <HomeStack.Screen name="AstroEssence" component={AstroEssenceScreen} options={{ title: "AstroEssence" }} />
    </HomeStack.Navigator>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home" component={HomeStackScreen} />
        <Tab.Screen name="Kundli" component={KundliScreen} />
        <Tab.Screen name="Fitness" component={FitnessScreen} />
        <Tab.Screen name="Connect" component={ConnectScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
