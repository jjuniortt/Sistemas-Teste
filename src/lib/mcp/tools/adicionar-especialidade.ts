import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "adicionar_especialidade",
  title: "Adicionar especialidade da emergência",
  description: "Cadastra uma especialidade atendida na emergência para o usuário autenticado.",
  inputSchema: {
    nome: z.string().trim().min(3).describe("Nome da especialidade (mínimo 3 caracteres)."),
    observacao: z.string().trim().optional().describe("Observação opcional."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ nome, observacao }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Não autenticado.");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("especialidades")
      .insert({ user_id: ctx.getUserId(), nome, observacao: observacao ?? null })
      .select()
      .single();
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: `Especialidade "${data.nome}" cadastrada.` }],
      structuredContent: { especialidade: data },
    };
  },
});
