import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_URL } from "@/api/base-url";
import { withTimeout } from "@/lib/with-timeout";
import { salvarTokens } from "@/store/auth-store";
import { cores, espacamento, radius } from "@/styles/tokens";

/**
 * Tela de login mobile.
 * - email + password + deviceId + platform (android)
 * - Após login: salva tokens no SecureStore → redireciona pra /notes
 *
 * UI: edge-to-edge, sem header do Stack.
 * - KeyboardAvoidingView: teclado não sobreponha os inputs
 * - Labels visuais pra acessibilidade (não só placeholder)
 * - Botão com spinner + activeOpacity feedback
 * - Dismiss keyboard ao tocar fora
 */
export default function TelaLogin() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function fazerLogin() {
    Keyboard.dismiss();
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
            deviceId: "mobile-dev",
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
      router.replace("/notes"); // login bem-sucedido → lista de notas
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      setErro(message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[estilos.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={estilos.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / branding */}
        <View style={estilos.logoContainer}>
          <Text style={estilos.logo}>• DevNote</Text>
        </View>

        {/* Título */}
        <Text style={estilos.titulo}>Bem-vindo de volta</Text>
        <Text style={estilos.subtitulo}>Login pra continuar</Text>

        {/* Erro */}
        {erro && <Text style={estilos.erro}>{erro}</Text>}

        {/* Email com label */}
        <View style={estilos.fieldGroup}>
          <Text style={estilos.label}>Email</Text>
          <TextInput
            style={estilos.input}
            placeholder="email@exemplo.com"
            placeholderTextColor={cores.foregroundMutedForeground}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            accessibilityLabel="Email"
            accessibilityHint="Digite seu email"
          />
        </View>

        {/* Senha com label + toggle de visibilidade */}
        <View style={estilos.fieldGroup}>
          <Text style={estilos.label}>Senha</Text>
          <View style={estilos.inputComIcon}>
            <TextInput
              style={[estilos.input, estilos.inputFlex]}
              placeholder="Sua senha"
              placeholderTextColor={cores.foregroundMutedForeground}
              value={senha}
              onChangeText={setSenha}
              secureTextEntry={!mostrarSenha}
              autoComplete="password"
              accessibilityLabel="Senha"
              accessibilityHint="Digite sua senha"
            />
            <TouchableOpacity
              onPress={() => setMostrarSenha(!mostrarSenha)}
              style={estilos.botaoIcon}
              accessibilityLabel={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              hitSlop={12}
            >
              <Text style={estilos.iconOlho}>{mostrarSenha ? "👁️" : "👁️‍🗨️"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Botão entrar */}
        <TouchableOpacity
          style={[estilos.botao, carregando && estilos.botaoDesativado]}
          onPress={fazerLogin}
          disabled={carregando}
          activeOpacity={0.8}
        >
          {carregando ? (
            <ActivityIndicator size="small" color={cores.primaryForeground} />
          ) : (
            <Text style={estilos.botaoTexto}>Entrar</Text>
          )}
        </TouchableOpacity>

        {/* Footer: forgot password */}
        <View style={estilos.footer}>
          <TouchableOpacity
            onPress={() => alert("Funcional em breve")}
            activeOpacity={0.7}
            hitSlop={12}
          >
            <Text style={estilos.linkRecuperacao}>Esqueci a senha</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: espacamento.lg,
    paddingBottom: espacamento.xl,
  },
  // Logo / branding
  logoContainer: {
    marginBottom: espacamento.xl2,
  },
  logo: {
    color: cores.primary,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 2,
  },
  // Tipografia
  titulo: {
    color: cores.foreground,
    fontSize: 22,
    fontWeight: "600",
    marginBottom: espacamento.xs,
  },
  subtitulo: {
    color: cores.foregroundMuted,
    fontSize: 14,
    marginBottom: espacamento.xl2,
  },
  // Labels
  fieldGroup: {
    width: "100%",
    marginBottom: espacamento.md,
  },
  label: {
    color: cores.foreground,
    fontSize: 13,
    fontWeight: "500",
    marginBottom: espacamento.xs,
  },
  input: {
    width: "100%",
    backgroundColor: cores.surfaceStrong,
    color: cores.foreground,
    padding: espacamento.md,
    borderRadius: radius.md,
    fontSize: 16,
  },
  // Input com icon (senha + toggle)
  inputComIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: cores.surfaceStrong,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  inputFlex: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  botaoIcon: {
    padding: espacamento.sm,
    paddingLeft: 0,
    paddingRight: espacamento.sm,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 44,
  },
  iconOlho: {
    fontSize: 18,
  },
  // Botão
  botao: {
    width: "100%",
    backgroundColor: cores.primary,
    padding: espacamento.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: espacamento.sm,
    minHeight: 48,
    justifyContent: "center",
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: cores.primaryForeground,
    fontSize: 16,
    fontWeight: "bold",
  },
  // Footer
  footer: {
    marginTop: espacamento.lg,
    alignItems: "center",
  },
  linkRecuperacao: {
    color: cores.foregroundMuted,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  erro: {
    color: cores.error,
    fontSize: 14,
    marginBottom: espacamento.sm,
    textAlign: "center",
    paddingHorizontal: espacamento.md,
  },
});
