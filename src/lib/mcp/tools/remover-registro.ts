import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const TABELAS = {
  especialidade: "especialidades",
  area_emergencia: "areas_emergencia",
  setor_internacao: "setores_internacao",
  unidade_critica: "unidades_criticas",
} as const;

export default defineTool({
  name: "remover_registro",
  title: "Remover registro da parametrização",
  description: "Remove definitivamente um registro cadastrado pelo usuário autenticado, pelo seu id.",
  inputSchema: {
    tipo: z
      .enum(["especialidade", "area_emergencia", "setor_internacao", "unidade_critica"])
      .describe("Categoria do registro a remover."),
    id: z.string().uuid().describe("Identificador do registro."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: false },
  handler: async ({ tipo, id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Não autenticado.");
    const supabase = supabaseForUser(ctx);
    const { error, count } = await supabase
      .from(TABELAS[tipo])
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", ctx.getUserId());
    if (error) throw new ToolError(error.message);
    if (!count) throw new ToolError("Registro não encontrado para este usuário.");
    return { content: [{ type: "text", text: `Registro ${id} removido.` }] };
  },
});
