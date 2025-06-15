import { BASE_URL } from "../config/constants";
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const UserChartContext = createContext();

export const UserChartProvider = ({ children }) => {
  const [userChart, setUserChart] = useState(null);

  useEffect(() => {
    const loadUserChart = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem('@user_chart');
        if (jsonValue != null) {
          setUserChart(JSON.parse(jsonValue));
        }
      } catch (e) {
        console.error('Failed to load user chart from AsyncStorage', e);
      }
    };

    loadUserChart();
  }, []);

  const updateUserChart = async (chart) => {
    try {
      const jsonValue = JSON.stringify(chart);
      await AsyncStorage.setItem('@user_chart', jsonValue);
      setUserChart(chart);
    } catch (e) {
      console.error('Failed to save user chart to AsyncStorage', e);
    }
  };

  return (
    <UserChartContext.Provider value={{ userChart, updateUserChart }}>
      {children}
    </UserChartContext.Provider>
  );
};
