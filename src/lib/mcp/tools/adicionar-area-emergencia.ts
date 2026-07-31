import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "adicionar_area_emergencia",
  title: "Adicionar área da emergência",
  description:
    "Cadastra uma área assistencial da emergência (verde, amarela, vermelha, observação ou outra) com a quantidade de leitos.",
  inputSchema: {
    tipo: z
      .enum(["Área Verde", "Área Amarela", "Área Vermelha", "Sala de Observação", "Outra área assistencial"])
      .describe("Tipo da área assistencial."),
    descricao: z.string().trim().min(3).describe("Descrição da área."),
    leitos: z.number().int().min(0).describe("Quantidade de leitos da área."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ tipo, descricao, leitos }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Não autenticado.");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("areas_emergencia")
      .insert({ user_id: ctx.getUserId(), tipo, descricao, leitos })
      .select()
      .single();
    if (error) throw new ToolError(error.message);
    return {
      content: [{ type: "text", text: `Área "${data.tipo}" cadastrada com ${data.leitos} leitos.` }],
      structuredContent: { area: data },
    };
  },
});
