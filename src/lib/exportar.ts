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
