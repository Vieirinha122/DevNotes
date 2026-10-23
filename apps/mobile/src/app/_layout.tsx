import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Root layout do app — monta o provider de navegação e safe areas.
 * Expo Router cuida do file-based routing automático.
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#080c13" },
          headerTintColor: "#ffffff",
          contentStyle: { backgroundColor: "#080c13" },
        }}
      >
        <Stack.Screen name="index" options={{ title: "DevNote" }} />
        <Stack.Screen name="home" options={{ title: "DevNote" }} />
      </Stack>
    </SafeAreaProvider>
  );
}
