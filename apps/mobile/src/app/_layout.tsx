import { Stack } from "expo-router/stack";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryProvider } from "@/providers/QueryProvider";

/**
 * Root layout do app — monta providers globais e navegação.
 *
 * Ordem de providers (da mais externa pra mais interna):
 * - GestureHandlerRootView: ROOT view pro gesture handler — precisa vir
 *   PRIMEIRO, senão PanGestureHandler (FlatList refresh, Swipeable) falha.
 * - SafeAreaProvider: context de safe areas
 * - QueryProvider: TanStack Query client
 *
 * Expo Router faz o file-based routing a partir de src/app/.
 * headerShown: false em todas as telas — UI edge-to-edge, cada tela
 * gerencia seu próprio header customizado (com BotaoVoltar onde preciso).
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false, // remove header padrão — cada tela tem header próprio
              contentStyle: { backgroundColor: "#090a0f" },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="notes/index" />
            <Stack.Screen name="notes/nova" />
            <Stack.Screen name="notes/editar/[id]" />
            <Stack.Screen name="home" />
          </Stack>
        </QueryProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
