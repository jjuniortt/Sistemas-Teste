import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "adicionar_setor_internacao",
  title: "Adicionar setor de internação",
  description:
    "Cadastra um setor/unidade de internação com quantidade de quartos e leitos por quarto. O total de leitos é o produto dos dois.",
  inputSchema: {
    nome: z.string().trim().min(3).describe("Nome do setor/unidade de internação."),
    quartos: z.number().int().min(1).describe("Quantidade de quartos do setor."),
    leitos_por_quarto: z.number().int().min(1).describe("Quantidade de leitos por quarto."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ nome, quartos, leitos_por_quarto }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Não autenticado.");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("setores_internacao")
      .insert({ user_id: ctx.getUserId(), nome, quartos, leitos_por_quarto })
      .select()
      .single();
    if (error) throw new ToolError(error.message);
    const total = data.quartos * data.leitos_por_quarto;
    return {
      content: [{ type: "text", text: `Setor "${data.nome}" cadastrado com ${total} leitos.` }],
      structuredContent: { setor: data, totalLeitos: total },
    };
  },
});
