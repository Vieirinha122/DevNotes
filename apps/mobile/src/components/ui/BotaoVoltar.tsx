import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cores, espacamento, toqueMinimo } from "@/styles/tokens";

interface BotaoVoltarProps {
  /** Texto customizado (default: "Voltar") */
  label?: string;
  /** Cor do ícone/texto */
  cor?: string;
  /** Callback extra (default: router.back()) */
  onPress?: () => void;
}

/**
 * Botão de voltar com ícone de chevron esquerdo (lucide-react-native).
 * - hitSlop: área de toque invisível ampliada
 * - minHeight 48dp: Material accessibility spec
 * - accessibilityRole + accessibilityLabel: screen readers
 * - Respeita safe area no topo (notch / status bar)
 */
export function BotaoVoltar({
  label = "Voltar",
  cor = cores.foregroundMuted,
  onPress,
}: BotaoVoltarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function handlePress() {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[estilos.botao, { marginTop: insets.top || espacamento.sm }]}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={`Voltar para ${label}`}
      accessibilityHint="Navega para a tela anterior"
    >
      <View style={estilos.container}>
        <ChevronLeft size={22} color={cor} strokeWidth={2} />
        <Text style={[estilos.label, { color: cor }]}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minHeight: toqueMinimo,
    justifyContent: "center",
    alignItems: "flex-start",
    alignSelf: "flex-start",
    paddingHorizontal: espacamento.sm,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
  },
});
