/**
 * Estruturas de cadastro derivadas do documento
 * "Solicitação de Informações para Parametrização do Sistema".
 * Os dados agora são persistidos no banco (Lovable Cloud), por usuário.
 */

export type AreaEmergenciaTipo =
  | "Área Verde"
  | "Área Amarela"
  | "Área Vermelha"
  | "Sala de Observação"
  | "Outra área assistencial";

export const AREAS_EMERGENCIA: AreaEmergenciaTipo[] = [
  "Área Verde",
  "Área Amarela",
  "Área Vermelha",
  "Sala de Observação",
  "Outra área assistencial",
];

export type Especialidade = {
  id: string;
  nome: string;
  observacao?: string | null;
};

export type AreaEmergencia = {
  id: string;
  tipo: AreaEmergenciaTipo;
  descricao: string;
  leitos: number;
};

export type SetorInternacao = {
  id: string;
  nome: string;
  quartos: number;
  leitosPorQuarto: number;
};

export type TipoUnidadeCritica = "UTI" | "UCI";
export type PerfilUnidadeCritica = "Adulto" | "Pediátrica" | "Neonatal" | "Outra";

export const PERFIS_UNIDADE_CRITICA: PerfilUnidadeCritica[] = [
  "Adulto",
  "Pediátrica",
  "Neonatal",
  "Outra",
];

export type UnidadeCritica = {
  id: string;
  tipo: TipoUnidadeCritica;
  perfil: PerfilUnidadeCritica;
  nome: string;
  leitos: number;
};

export type Cadastro = {
  especialidades: Especialidade[];
  areasEmergencia: AreaEmergencia[];
  setoresInternacao: SetorInternacao[];
  unidadesCriticas: UnidadeCritica[];
};

export const cadastroVazio: Cadastro = {
  especialidades: [],
  areasEmergencia: [],
  setoresInternacao: [],
  unidadesCriticas: [],
};

export const totalLeitosEmergencia = (c: Cadastro) =>
  c.areasEmergencia.reduce((s, a) => s + a.leitos, 0);

export const leitosDoSetor = (s: SetorInternacao) => s.quartos * s.leitosPorQuarto;

export const totalLeitosInternacao = (c: Cadastro) =>
  c.setoresInternacao.reduce((s, x) => s + leitosDoSetor(x), 0);

export const totalLeitosCriticos = (c: Cadastro, tipo?: TipoUnidadeCritica) =>
  c.unidadesCriticas
    .filter((u) => !tipo || u.tipo === tipo)
    .reduce((s, u) => s + u.leitos, 0);

export const totalGeralLeitos = (c: Cadastro) =>
  totalLeitosEmergencia(c) + totalLeitosInternacao(c) + totalLeitosCriticos(c);
