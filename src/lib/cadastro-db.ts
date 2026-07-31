import { supabase } from "@/integrations/supabase/client";
import type { EmpresaCodigo } from "./empresas";
import type {
  AreaEmergencia,
  AreaEmergenciaTipo,
  Cadastro,
  Especialidade,
  PerfilUnidadeCritica,
  SetorInternacao,
  TipoUnidadeCritica,
  UnidadeCritica,
} from "./cadastro-store";

export async function carregarCadastro(
  userId: string,
  empresa: EmpresaCodigo,
): Promise<Cadastro> {
  const [esp, areas, setores, unidades] = await Promise.all([
    supabase
      .from("especialidades")
      .select("*")
      .eq("user_id", userId)
      .eq("empresa", empresa)
      .order("created_at", { ascending: true }),
    supabase
      .from("areas_emergencia")
      .select("*")
      .eq("user_id", userId)
      .eq("empresa", empresa)
      .order("created_at", { ascending: true }),
    supabase
      .from("setores_internacao")
      .select("*")
      .eq("user_id", userId)
      .eq("empresa", empresa)
      .order("created_at", { ascending: true }),
    supabase
      .from("unidades_criticas")
      .select("*")
      .eq("user_id", userId)
      .eq("empresa", empresa)
      .order("created_at", { ascending: true }),
  ]);

  const erro = esp.error || areas.error || setores.error || unidades.error;
  if (erro) throw erro;

  return {
    especialidades: (esp.data ?? []).map((e) => ({
      id: e.id,
      nome: e.nome,
      observacao: e.observacao,
    })),
    areasEmergencia: (areas.data ?? []).map((a) => ({
      id: a.id,
      tipo: a.tipo as AreaEmergenciaTipo,
      descricao: a.descricao,
      leitos: a.leitos,
    })),
    setoresInternacao: (setores.data ?? []).map((s) => ({
      id: s.id,
      nome: s.nome,
      quartos: s.quartos,
      leitosPorQuarto: s.leitos_por_quarto,
    })),
    unidadesCriticas: (unidades.data ?? []).map((u) => ({
      id: u.id,
      tipo: u.tipo as TipoUnidadeCritica,
      perfil: u.perfil as PerfilUnidadeCritica,
      nome: u.nome,
      leitos: u.leitos,
    })),
  };
}

export async function inserirEspecialidade(
  userId: string,
  empresa: EmpresaCodigo,
  dados: Omit<Especialidade, "id">,
): Promise<Especialidade> {
  const { data, error } = await supabase
    .from("especialidades")
    .insert({ user_id: userId, empresa, nome: dados.nome, observacao: dados.observacao ?? null })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id, nome: data.nome, observacao: data.observacao };
}

export async function inserirArea(
  userId: string,
  empresa: EmpresaCodigo,
  dados: Omit<AreaEmergencia, "id">,
): Promise<AreaEmergencia> {
  const { data, error } = await supabase
    .from("areas_emergencia")
    .insert({ user_id: userId, empresa, ...dados })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    tipo: data.tipo as AreaEmergenciaTipo,
    descricao: data.descricao,
    leitos: data.leitos,
  };
}

export async function inserirSetor(
  userId: string,
  empresa: EmpresaCodigo,
  dados: Omit<SetorInternacao, "id">,
): Promise<SetorInternacao> {
  const { data, error } = await supabase
    .from("setores_internacao")
    .insert({
      user_id: userId,
      empresa,
      nome: dados.nome,
      quartos: dados.quartos,
      leitos_por_quarto: dados.leitosPorQuarto,
    })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    nome: data.nome,
    quartos: data.quartos,
    leitosPorQuarto: data.leitos_por_quarto,
  };
}

export async function inserirUnidadeCritica(
  userId: string,
  empresa: EmpresaCodigo,
  dados: Omit<UnidadeCritica, "id">,
): Promise<UnidadeCritica> {
  const { data, error } = await supabase
    .from("unidades_criticas")
    .insert({ user_id: userId, empresa, ...dados })
    .select()
    .single();
  if (error) throw error;
  return {
    id: data.id,
    tipo: data.tipo as TipoUnidadeCritica,
    perfil: data.perfil as PerfilUnidadeCritica,
    nome: data.nome,
    leitos: data.leitos,
  };
}

export async function atualizarEspecialidade(id: string, dados: Omit<Especialidade, "id">) {
  const { error } = await supabase
    .from("especialidades")
    .update({ nome: dados.nome, observacao: dados.observacao ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function atualizarArea(id: string, dados: Omit<AreaEmergencia, "id">) {
  const { error } = await supabase
    .from("areas_emergencia")
    .update({ tipo: dados.tipo, descricao: dados.descricao, leitos: dados.leitos })
    .eq("id", id);
  if (error) throw error;
}

export async function atualizarSetor(id: string, dados: Omit<SetorInternacao, "id">) {
  const { error } = await supabase
    .from("setores_internacao")
    .update({
      nome: dados.nome,
      quartos: dados.quartos,
      leitos_por_quarto: dados.leitosPorQuarto,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function atualizarUnidadeCritica(id: string, dados: Omit<UnidadeCritica, "id">) {
  const { error } = await supabase
    .from("unidades_criticas")
    .update({ tipo: dados.tipo, perfil: dados.perfil, nome: dados.nome, leitos: dados.leitos })
    .eq("id", id);
  if (error) throw error;
}

export const TABELAS: Record<keyof Cadastro, string> = {
  especialidades: "especialidades",
  areasEmergencia: "areas_emergencia",
  setoresInternacao: "setores_internacao",
  unidadesCriticas: "unidades_criticas",
};

export async function removerRegistro(chave: keyof Cadastro, id: string) {
  const { error } = await supabase
    .from(TABELAS[chave] as "especialidades")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
