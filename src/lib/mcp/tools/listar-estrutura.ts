import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_estrutura",
  title: "Listar estrutura assistencial",
  description:
    "Lista toda a parametrização do usuário autenticado: especialidades e áreas da emergência, setores de internação e unidades críticas (UTI/UCI), com o total de leitos.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Não autenticado.");
    const supabase = supabaseForUser(ctx);
    const userId = ctx.getUserId();

    const [esp, areas, setores, unidades] = await Promise.all([
      supabase.from("especialidades").select("*").eq("user_id", userId),
      supabase.from("areas_emergencia").select("*").eq("user_id", userId),
      supabase.from("setores_internacao").select("*").eq("user_id", userId),
      supabase.from("unidades_criticas").select("*").eq("user_id", userId),
    ]);
    const erro = esp.error || areas.error || setores.error || unidades.error;
    if (erro) throw new ToolError(erro.message);

    const leitosEmergencia = (areas.data ?? []).reduce((t, a) => t + (a.leitos ?? 0), 0);
    const leitosInternacao = (setores.data ?? []).reduce(
      (t, s) => t + (s.quartos ?? 0) * (s.leitos_por_quarto ?? 0),
      0,
    );
    const leitosUTI = (unidades.data ?? [])
      .filter((u) => u.tipo === "UTI")
      .reduce((t, u) => t + (u.leitos ?? 0), 0);
    const leitosUCI = (unidades.data ?? [])
      .filter((u) => u.tipo === "UCI")
      .reduce((t, u) => t + (u.leitos ?? 0), 0);

    const resumo = {
      especialidades: esp.data ?? [],
      areasEmergencia: areas.data ?? [],
      setoresInternacao: setores.data ?? [],
      unidadesCriticas: unidades.data ?? [],
      totais: {
        leitosEmergencia,
        leitosInternacao,
        leitosUTI,
        leitosUCI,
        leitosTotal: leitosEmergencia + leitosInternacao + leitosUTI + leitosUCI,
      },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(resumo, null, 2) }],
      structuredContent: resumo,
    };
  },
});
