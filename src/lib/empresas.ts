/**
 * Empresas (hospitais) fixas da aplicação multiempresa.
 * O código é persistido no banco na coluna `empresa` de cada tabela.
 */

export type EmpresaCodigo =
  | "humberto-lucena"
  | "guarabira"
  | "solanea"
  | "mamanguape"
  | "arlinda-marques";

export type Empresa = { codigo: EmpresaCodigo; nome: string };

export const EMPRESAS: Empresa[] = [
  { codigo: "humberto-lucena", nome: "Hospital de Emergência e Trauma Senador Humberto Lucena" },
  { codigo: "guarabira", nome: "Hospital de Guarabira" },
  { codigo: "solanea", nome: "Hospital de Solanea" },
  { codigo: "mamanguape", nome: "Hospital de Mamanguape" },
  { codigo: "arlinda-marques", nome: "Hospital Arlinda Marques" },
];

export const EMPRESA_PADRAO: EmpresaCodigo = "humberto-lucena";

const CHAVE = "empresa-ativa";

export const ehEmpresaValida = (v: unknown): v is EmpresaCodigo =>
  typeof v === "string" && EMPRESAS.some((e) => e.codigo === v);

export const nomeEmpresa = (codigo: EmpresaCodigo) =>
  EMPRESAS.find((e) => e.codigo === codigo)?.nome ?? "";

export function obterEmpresaAtiva(): EmpresaCodigo | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(CHAVE);
  return ehEmpresaValida(v) ? v : null;
}

export function definirEmpresaAtiva(codigo: EmpresaCodigo) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, codigo);
}

export function limparEmpresaAtiva() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAVE);
}
