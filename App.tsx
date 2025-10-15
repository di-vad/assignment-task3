import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import MapScreen from "./src/screens/MapScreen";
import EventCreateScreen from "./src/screens/EventCreateScreen";

export type RootStackParamList = {
  Map: undefined;
  CreateEvent: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: true }}>
        <Stack.Screen
          name="Map"
          component={MapScreen}
          options={{ title: "Events Map" }}
        />
        <Stack.Screen
          name="CreateEvent"
          component={EventCreateScreen}
          options={{ title: "New Event" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
