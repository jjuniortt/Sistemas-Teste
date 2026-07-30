/**
 * Estruturas de cadastro derivadas do documento
 * "Solicitação de Informações para Parametrização do Sistema".
 *
 * Os dados abaixo são ESTÁTICOS (demonstração/parametrização inicial).
 * O documento não informa valores reais — os registros aqui presentes
 * servem apenas de exemplo de preenchimento.
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
  observacao?: string;
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

export const cadastroInicial: Cadastro = {
  especialidades: [
    { id: "esp-1", nome: "Clínica Médica" },
    { id: "esp-2", nome: "Ortopedia" },
    { id: "esp-3", nome: "Pediatria", observacao: "Plantão 24h" },
  ],
  areasEmergencia: [
    { id: "ae-1", tipo: "Área Verde", descricao: "Acolhimento / baixo risco", leitos: 12 },
    { id: "ae-2", tipo: "Área Amarela", descricao: "Risco intermediário", leitos: 8 },
    { id: "ae-3", tipo: "Área Vermelha", descricao: "Sala de emergência", leitos: 4 },
    { id: "ae-4", tipo: "Sala de Observação", descricao: "Observação adulto", leitos: 10 },
  ],
  setoresInternacao: [
    { id: "si-1", nome: "Internação Cirúrgica – 2º andar", quartos: 10, leitosPorQuarto: 2 },
    { id: "si-2", nome: "Internação Clínica – 3º andar", quartos: 12, leitosPorQuarto: 2 },
    { id: "si-3", nome: "Maternidade", quartos: 6, leitosPorQuarto: 1 },
  ],
  unidadesCriticas: [
    { id: "uc-1", tipo: "UTI", perfil: "Adulto", nome: "UTI Adulto I", leitos: 10 },
    { id: "uc-2", tipo: "UTI", perfil: "Pediátrica", nome: "UTI Pediátrica", leitos: 6 },
    { id: "uc-3", tipo: "UTI", perfil: "Neonatal", nome: "UTI Neonatal", leitos: 8 },
    { id: "uc-4", tipo: "UCI", perfil: "Neonatal", nome: "UCI Neonatal Convencional", leitos: 5 },
  ],
};

export const novoId = (prefixo: string) =>
  `${prefixo}-${Math.random().toString(36).slice(2, 9)}`;

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

/* ---------- Autenticação estática (demonstração) ---------- */

export const USUARIO_DEMO = { usuario: "admin", senha: "hospital123" };
const CHAVE_SESSAO = "cadastro-hospitalar:sessao";

export const autenticar = (usuario: string, senha: string) => {
  const ok =
    usuario.trim().toLowerCase() === USUARIO_DEMO.usuario && senha === USUARIO_DEMO.senha;
  if (ok && typeof window !== "undefined") {
    window.sessionStorage.setItem(CHAVE_SESSAO, usuario.trim());
  }
  return ok;
};

export const sessaoAtual = () =>
  typeof window === "undefined" ? null : window.sessionStorage.getItem(CHAVE_SESSAO);

export const encerrarSessao = () => {
  if (typeof window !== "undefined") window.sessionStorage.removeItem(CHAVE_SESSAO);
};
