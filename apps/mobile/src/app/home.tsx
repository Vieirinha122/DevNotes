import { StyleSheet, Text, View } from "react-native";

/**
 * Tela provisoria pos-login.
 * Mantem o fluxo navegavel enquanto a area autenticada completa nao existe.
 */
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login realizado</Text>
      <Text style={styles.subtitle}>Sua sessao foi salva no dispositivo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080c13",
    padding: 24,
  },
  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 15,
    textAlign: "center",
  },
});
