import { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { API_URL } from "@/api/base-url";
import { withTimeout } from "@/lib/with-timeout";
import { salvarTokens } from "@/store/auth-store";

/**
 * Tela de login mobile.
 * Usa email + password + deviceId + platform (android fixo).
 * Após login bem-sucedido, salva tokens no secure store.
 */
export default function TelaLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin() {
    setCarregando(true);
    setErro(null);

    try {
      const response = await withTimeout(
        fetch(`${API_URL}/mobile-auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: senha,
            deviceId: "mobile-dev", // simplificado pra primeira iteracao
            platform: "android",
          }),
        }),
        12000,
        "A API demorou demais para responder. Verifique se o backend esta rodando.",
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Falha no login");
      }

      const data = await response.json();
      await withTimeout(
        salvarTokens(data.accessToken, data.refreshToken),
        5000,
        "Nao foi possivel salvar a sessao no dispositivo.",
      );
      router.replace("/home");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setErro(message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={estilos.container}>
      <Text style={estilos.titulo}>DevNote Mobile</Text>
      <Text style={estilos.subtitulo}>Login pra continuar</Text>

      {erro && <Text style={estilos.erro}>{erro}</Text>}

      <TextInput
        style={estilos.input}
        placeholder="Email"
        placeholderTextColor="#6b7280"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={estilos.input}
        placeholder="Senha"
        placeholderTextColor="#6b7280"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
      />

      <TouchableOpacity
        style={[estilos.botao, carregando && estilos.botaoDesativado]}
        onPress={fazerLogin}
        disabled={carregando}
      >
        <Text style={estilos.botaoTexto}>{carregando ? "Entrando..." : "Entrar"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080c13",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  titulo: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitulo: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 32,
  },
  input: {
    width: "100%",
    backgroundColor: "#1a1f29",
    color: "#ffffff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  botao: {
    width: "100%",
    backgroundColor: "#10b981",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  botaoDesativado: {
    opacity: 0.5,
  },
  botaoTexto: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  erro: {
    color: "#f87171",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
});
