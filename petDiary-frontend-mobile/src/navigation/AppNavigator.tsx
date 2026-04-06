import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeTutor } from '../screens/HomeTutor';
import { PetDashboard } from '../screens/PetDashboard';
import type { Pet } from '../types';

export type RootStackParamList = {
  HomeTutor: undefined;
  PetDashboard: { pet: Pet };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="HomeTutor"
        screenOptions={{
          headerStyle: { backgroundColor: '#4A90D9' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="HomeTutor"
          component={HomeTutor}
          options={{ title: 'Meus Pets' }}
        />
        <Stack.Screen
          name="PetDashboard"
          component={PetDashboard}
          options={({ route }) => ({ title: route.params.pet.name })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
