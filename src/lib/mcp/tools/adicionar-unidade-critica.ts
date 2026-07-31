import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "adicionar_unidade_critica",
  title: "Adicionar UTI ou UCI",
  description: "Cadastra uma unidade crítica (UTI ou UCI) com perfil e quantidade de leitos.",
  inputSchema: {
    tipo: z.enum(["UTI", "UCI"]).describe("Tipo da unidade crítica."),
    perfil: z.enum(["Adulto", "Pediátrica", "Neonatal", "Outra"]).describe("Perfil assistencial."),
    nome: z.string().trim().min(3).describe("Identificação da unidade."),
    leitos: z.number().int().min(1).describe("Quantidade de leitos da unidade."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ tipo, perfil, nome, leitos }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Não autenticado.");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("unidades_criticas")
      .insert({ user_id: ctx.getUserId(), tipo, perfil, nome, leitos })
      .select()
      .single();
    if (error) throw new ToolError(error.message);
    return {
      content: [
        { type: "text", text: `${data.tipo} ${data.perfil} "${data.nome}" cadastrada com ${data.leitos} leitos.` },
      ],
      structuredContent: { unidade: data },
    };
  },
});
