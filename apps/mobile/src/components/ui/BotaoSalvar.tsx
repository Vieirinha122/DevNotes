import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from "react-native";
import { cores, espacamento, radius, toqueMinimo } from "@/styles/tokens";

interface BotaoSalvarProps {
  /** Estado de loading — mostra spinner e desabilita */
  carregando?: boolean;
  /** Ação disparada (validação do form é responsabilidade do FormularioNota via ref) */
  onPress: () => void;
  /** Desabilita visual e semanticamente */
  disabled?: boolean;
}

/**
 * Botão Salvar pra posição de trailing do top app bar.
 * - Quando carregando: spinner + disabled (previne double submit)
 * - Texto "Salvar" (não "Concluído" — ação é salvar, não concluir flow)
 */
export function BotaoSalvar({ carregando, onPress, disabled }: BotaoSalvarProps) {
  const desativado = carregando || disabled;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={desativado}
      activeOpacity={0.8}
      style={[estilos.botao, desativado && estilos.desativado]}
      accessibilityRole="button"
      accessibilityLabel="Salvar nota"
      accessibilityHint="Salva as alterações desta nota"
      accessibilityState={{ busy: !!carregando, disabled: !!disabled }}
    >
      {carregando ? (
        <ActivityIndicator size="small" color={cores.primaryForeground} />
      ) : (
        <Text style={estilos.texto}>Salvar</Text>
      )}
    </TouchableOpacity>
  );
}

const estilos = StyleSheet.create({
  botao: {
    minWidth: toqueMinimo,
    minHeight: toqueMinimo,
    paddingHorizontal: espacamento.sm,
    borderRadius: radius.full,
    backgroundColor: cores.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  desativado: {
    opacity: 0.6,
  },
  texto: {
    color: cores.primaryForeground,
    fontSize: 15,
    fontWeight: "600",
  },
});
