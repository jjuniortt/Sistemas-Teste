/**
 * Empresas (hospitais) fixas da aplicação multiempresa.
 * O código é persistido no banco na coluna `empresa` de cada tabela.
 */

export type EmpresaCodigo = "dom-luiz-gonzaga" | "humberto-lucena" | "distrital-belem";

export type Empresa = { codigo: EmpresaCodigo; nome: string };

export const EMPRESAS: Empresa[] = [
  { codigo: "dom-luiz-gonzaga", nome: "Hospital Emergência e Trauma Dom Luiz Gonzaga" },
  { codigo: "humberto-lucena", nome: "Hospital de Emergência e Trauma Senador Humberto Lucena" },
  { codigo: "distrital-belem", nome: "Hospital Distrital de Belém" },
];

export const EMPRESA_PADRAO: EmpresaCodigo = "dom-luiz-gonzaga";

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
