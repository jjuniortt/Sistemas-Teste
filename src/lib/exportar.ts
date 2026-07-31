import {
  leitosDoSetor,
  totalGeralLeitos,
  totalLeitosCriticos,
  totalLeitosEmergencia,
  totalLeitosInternacao,
  type Cadastro,
} from "./cadastro-store";

function baixar(conteudo: string, nome: string, tipo: string) {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

const carimbo = () => new Date().toISOString().slice(0, 10);

export function exportarJSON(c: Cadastro) {
  const payload = {
    geradoEm: new Date().toISOString(),
    parametrizacao: c,
    totais: {
      leitosEmergencia: totalLeitosEmergencia(c),
      leitosInternacao: totalLeitosInternacao(c),
      leitosUTI: totalLeitosCriticos(c, "UTI"),
      leitosUCI: totalLeitosCriticos(c, "UCI"),
      totalGeral: totalGeralLeitos(c),
    },
  };
  baixar(JSON.stringify(payload, null, 2), `parametrizacao-${carimbo()}.json`, "application/json");
}

const csvCampo = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const linha = (campos: (string | number)[]) => campos.map(csvCampo).join(";");

export function exportarCSV(c: Cadastro) {
  const linhas: string[] = [linha(["Bloco", "Campo 1", "Campo 2", "Campo 3", "Leitos"])];

  for (const e of c.especialidades)
    linhas.push(linha(["Emergência - Especialidade", e.nome, e.observacao ?? "", "", ""]));
  for (const a of c.areasEmergencia)
    linhas.push(linha(["Emergência - Área", a.tipo, a.descricao, "", a.leitos]));
  for (const s of c.setoresInternacao)
    linhas.push(
      linha([
        "Internação - Setor",
        s.nome,
        `${s.quartos} quartos`,
        `${s.leitosPorQuarto} leitos/quarto`,
        leitosDoSetor(s),
      ]),
    );
  for (const u of c.unidadesCriticas)
    linhas.push(linha([`Unidade crítica - ${u.tipo}`, u.nome, u.perfil, "", u.leitos]));

  linhas.push("");
  linhas.push(linha(["Total", "Leitos emergência", "", "", totalLeitosEmergencia(c)]));
  linhas.push(linha(["Total", "Leitos internação", "", "", totalLeitosInternacao(c)]));
  linhas.push(linha(["Total", "Leitos UTI", "", "", totalLeitosCriticos(c, "UTI")]));
  linhas.push(linha(["Total", "Leitos UCI", "", "", totalLeitosCriticos(c, "UCI")]));
  linhas.push(linha(["Total", "Total geral de leitos", "", "", totalGeralLeitos(c)]));

  baixar("\uFEFF" + linhas.join("\n"), `parametrizacao-${carimbo()}.csv`, "text/csv;charset=utf-8");
}

const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);

function tabela(titulo: string, colunas: string[], linhas: (string | number)[][]) {
  const corpo = linhas.length
    ? linhas
        .map((l) => `<tr>${l.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`)
        .join("")
    : `<tr><td colspan="${colunas.length}" class="vazio">Nenhum registro cadastrado.</td></tr>`;
  return `<section><h2>${esc(titulo)}</h2><table><thead><tr>${colunas
    .map((c) => `<th>${esc(c)}</th>`)
    .join("")}</tr></thead><tbody>${corpo}</tbody></table></section>`;
}

export function exportarPDF(c: Cadastro, identificacao?: string) {
  const utis = c.unidadesCriticas.filter((u) => u.tipo === "UTI");
  const ucis = c.unidadesCriticas.filter((u) => u.tipo === "UCI");

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" />
<title>Parametrização da Estrutura Assistencial</title>
<style>
  *{box-sizing:border-box}
  body{font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial,sans-serif;color:#14231d;margin:0;padding:32px;background:#fff}
  h1{font-size:22px;margin:0 0 4px}
  .meta{color:#5c6b64;font-size:12px;margin-bottom:20px}
  .resumo{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:24px}
  .resumo div{border:1px solid #d9e2dd;border-radius:8px;padding:10px}
  .resumo span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#5c6b64}
  .resumo strong{font-size:20px}
  section{margin-bottom:22px;page-break-inside:avoid}
  h2{font-size:14px;margin:0 0 8px;padding-bottom:4px;border-bottom:2px solid #14231d}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th,td{border:1px solid #d9e2dd;padding:6px 8px;text-align:left}
  th{background:#f2f6f4}
  .vazio{color:#7b8a83;font-style:italic}
  .acoes{margin-bottom:20px}
  button{font:inherit;padding:8px 14px;border-radius:6px;border:1px solid #14231d;background:#14231d;color:#fff;cursor:pointer}
  @media print{.acoes{display:none}body{padding:0}}
</style></head><body>
<div class="acoes"><button onclick="window.print()">Imprimir / salvar em PDF</button></div>
<h1>Parametrização da Estrutura Assistencial</h1>
<p class="meta">${esc(identificacao ? identificacao + " — " : "")}Gerado em ${esc(new Date().toLocaleString("pt-BR"))}</p>
<div class="resumo">
  <div><span>Leitos emergência</span><strong>${totalLeitosEmergencia(c)}</strong></div>
  <div><span>Leitos internação</span><strong>${totalLeitosInternacao(c)}</strong></div>
  <div><span>Leitos UTI</span><strong>${totalLeitosCriticos(c, "UTI")}</strong></div>
  <div><span>Leitos UCI</span><strong>${totalLeitosCriticos(c, "UCI")}</strong></div>
  <div><span>Total geral</span><strong>${totalGeralLeitos(c)}</strong></div>
</div>
${tabela(
  "Emergência — especialidades atendidas",
  ["Especialidade", "Observação"],
  c.especialidades.map((e) => [e.nome, e.observacao ?? "—"]),
)}
${tabela(
  "Emergência — áreas de atendimento e leitos",
  ["Área", "Descrição", "Leitos"],
  [
    ...c.areasEmergencia.map((a) => [a.tipo, a.descricao || "—", a.leitos] as (string | number)[]),
    ...(c.areasEmergencia.length ? [["Total", "", totalLeitosEmergencia(c)] as (string | number)[]] : []),
  ],
)}
${tabela(
  "Internação — setores, quartos e leitos",
  ["Setor/unidade", "Quartos", "Leitos por quarto", "Total de leitos"],
  [
    ...c.setoresInternacao.map(
      (s) => [s.nome, s.quartos, s.leitosPorQuarto, leitosDoSetor(s)] as (string | number)[],
    ),
    ...(c.setoresInternacao.length
      ? [["Total", "", "", totalLeitosInternacao(c)] as (string | number)[]]
      : []),
  ],
)}
${tabela(
  "Unidades de Terapia Intensiva (UTI)",
  ["Unidade", "Perfil", "Leitos"],
  [
    ...utis.map((u) => [u.nome, u.perfil, u.leitos] as (string | number)[]),
    ...(utis.length ? [["Total", "", totalLeitosCriticos(c, "UTI")] as (string | number)[]] : []),
  ],
)}
${tabela(
  "Unidades de Cuidados Intermediários (UCI)",
  ["Unidade", "Perfil", "Leitos"],
  [
    ...ucis.map((u) => [u.nome, u.perfil, u.leitos] as (string | number)[]),
    ...(ucis.length ? [["Total", "", totalLeitosCriticos(c, "UCI")] as (string | number)[]] : []),
  ],
)}
</body></html>`;

  const janela = window.open("", "_blank");
  if (!janela) return false;
  janela.document.open();
  janela.document.write(html);
  janela.document.close();
  return true;
}
