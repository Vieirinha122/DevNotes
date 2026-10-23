import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import TelaLogin from "@/screens/auth/TelaLogin";
import { recuperarAccessToken } from "@/store/auth-store";

/**
 * Index — tela inicial.
 * Se ja houver sessao salva, manda o usuario direto pra area autenticada.
 */
export default function IndexScreen() {
  const router = useRouter();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    async function hydrateSession() {
      const token = await recuperarAccessToken();

      if (!active) {
        return;
      }

      if (token) {
        router.replace("/home");
        return;
      }

      setCheckingSession(false);
    }

    hydrateSession();

    return () => {
      active = false;
    };
  }, [router]);

  if (checkingSession) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return <TelaLogin />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080c13",
  },
});
