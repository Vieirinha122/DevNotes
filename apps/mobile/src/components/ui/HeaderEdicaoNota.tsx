import { Trash2 } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { cores, espacamento, radius, toqueMinimo } from "@/styles/tokens";
import { BotaoSalvar } from "./BotaoSalvar";
import { BotaoVoltar } from "./BotaoVoltar";
import { ToggleFixar } from "./ToggleFixar";

interface HeaderEdicaoNotaProps {
  /** "Cancelar" → texto puro (sem chevron); senão usa BotaoVoltar (chevron + label) */
  voltarLabel?: string;
  /** Ação ao clicar esquerdo — a tela injeta Alert.confirm se preciso */
  onVoltar?: () => void;
  /** Estado de fixação — controlado pela tela */
  fixada: boolean;
  /** Alterna fixação (imediata na edição / local na criação) */
  onFixar: () => void;
  /** Ação de exclusão (apenas na tela de edição) */
  onExcluir?: () => void;
  /** Salva (chama ref do FormularioNota) */
  onSalvar: () => void;
  /** Loading do save */
  carregando: boolean;
  /** Estilo extra pro container (ex: safe-area top) */
  headerStyle?: object;
}

/**
 * Header de edição/criação — top app bar customizado.
 *
 * Direção clean: BotaoVoltar (ou "Cancelar" texto) — [Excluir] — ToggleFixar — BotaoSalvar.
 * - Na criação: label "Cancelar" (sem chevron) + confirmação de descarte.
 * - Na edição: BotaoVoltar "Notas" + botão de lixeira com confirmação + pin + salvar.
 * - Salvar é trailing action (Material top app bar spec) com spinner.
 */
export function HeaderEdicaoNota({
  voltarLabel = "Voltar",
  onVoltar,
  fixada,
  onFixar,
  onExcluir,
  onSalvar,
  carregando,
  headerStyle,
}: HeaderEdicaoNotaProps) {
  const ehCancelar = voltarLabel === "Cancelar";

  return (
    <View style={[estilos.header, headerStyle]}>
      {/* Botão esquerdo: Cancelar (texto) ou BotaoVoltar (chevron) */}
      {ehCancelar ? (
        <TouchableOpacity
          onPress={onVoltar}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Cancelar"
          accessibilityHint="Descarta a nota sem salvar"
        >
          <Text style={estilos.cancelarTexto}>Cancelar</Text>
        </TouchableOpacity>
      ) : (
        <BotaoVoltar label={voltarLabel} onPress={onVoltar} />
      )}

      {/* Ações direitas: excluir (se houver) + pin toggle + salvar */}
      <View style={estilos.acoes}>
        {onExcluir && (
          <TouchableOpacity
            onPress={onExcluir}
            style={estilos.botaoExcluir}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Excluir nota"
            accessibilityHint="Abre o diálogo para confirmar a exclusão da nota"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={20} color={cores.error} strokeWidth={1.75} />
          </TouchableOpacity>
        )}
        <ToggleFixar fixada={fixada} onPress={onFixar} />
        <BotaoSalvar carregando={carregando} onPress={onSalvar} />
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: espacamento.lg,
    paddingVertical: espacamento.sm,
    gap: espacamento.xs,
    marginBottom: espacamento.md,
    borderBottomWidth: 1,
    borderBottomColor: cores.border,
  },
  acoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: espacamento.sm,
  },
  botaoExcluir: {
    minWidth: toqueMinimo - 8,
    minHeight: toqueMinimo - 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.full,
    padding: 6,
  },
  cancelarTexto: {
    color: cores.foregroundMuted,
    fontSize: 15,
    fontWeight: "500",
  },
});
