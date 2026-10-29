import { Pin } from "lucide-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";
import { cores, toqueMinimo } from "@/styles/tokens";

interface ToggleFixarProps {
  /** Estado atual de fixação */
  fixada: boolean;
  /** Alterna o estado */
  onPress: () => void;
}

/**
 * Toggle de fixar nota — ícone lucide `Pin` preenchido quando ativo.
 * - fill verde (cores.primary) quando fixada → feedback visual imediato
 * - color cinza (foregroundMuted) quando desativada
 * - 48dp mínimo + hitSlop implícito (TouchableOpacity)
 */
export function ToggleFixar({ fixada, onPress }: ToggleFixarProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[estilos.botao, fixada && estilos.ativo]}
      accessibilityRole="button"
      accessibilityLabel={fixada ? "Desfixar nota" : "Fixar nota"}
      accessibilityHint="Fixa esta nota no topo da lista"
      accessibilityState={{ selected: fixada }}
    >
      <Pin
        size={20}
        color={fixada ? cores.primaryForeground : cores.foregroundMutedForeground}
        fill={fixada ? cores.primary : "transparent"}
        strokeWidth={1.5}
      />
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minWidth: toqueMinimo,
    minHeight: toqueMinimo,
    padding: 8,
    borderRadius: toqueMinimo / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  ativo: {
    backgroundColor: cores.surfaceStrong,
  },
});
