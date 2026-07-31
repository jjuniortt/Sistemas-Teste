import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listarEstrutura from "./tools/listar-estrutura";
import adicionarEspecialidade from "./tools/adicionar-especialidade";
import adicionarAreaEmergencia from "./tools/adicionar-area-emergencia";
import adicionarSetorInternacao from "./tools/adicionar-setor-internacao";
import adicionarUnidadeCritica from "./tools/adicionar-unidade-critica";
import removerRegistro from "./tools/remover-registro";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "data-weaver",
  title: "Data Weaver",
  version: "0.1.0",
  instructions:
    "Ferramentas para consultar e manter a parametrização da estrutura assistencial hospitalar (emergência, internação, UTI e UCI) do usuário autenticado.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listarEstrutura,
    adicionarEspecialidade,
    adicionarAreaEmergencia,
    adicionarSetorInternacao,
    adicionarUnidadeCritica,
    removerRegistro,
  ],
});
