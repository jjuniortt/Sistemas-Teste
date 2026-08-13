import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  AREAS_EMERGENCIA,
  PERFIS_UNIDADE_CRITICA,
  cadastroVazio,
  leitosDoSetor,
  totalGeralLeitos,
  totalLeitosCriticos,
  totalLeitosEmergencia,
  totalLeitosInternacao,
  type AreaEmergenciaTipo,
  type Cadastro,
  type PerfilUnidadeCritica,
  type TipoUnidadeCritica,
} from "@/lib/cadastro-store";
import {
  atualizarArea,
  atualizarEspecialidade,
  atualizarSetor,
  atualizarUnidadeCritica,
  carregarCadastro,
  inserirArea,
  inserirEspecialidade,
  inserirSetor,
  inserirUnidadeCritica,
  removerRegistro,
} from "@/lib/cadastro-db";
import { exportarCSV, exportarJSON, exportarPDF } from "@/lib/exportar";
import {
  limparEmpresaAtiva,
  nomeEmpresa,
  obterEmpresaAtiva,
  type EmpresaCodigo,
} from "@/lib/empresas";


export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Cadastro da Estrutura Assistencial Hospitalar" },
      {
        name: "description",
        content:
          "Cadastre especialidades da emergência, áreas de acolhimento, setores de internação, quartos, leitos, UTIs e UCIs para parametrização do sistema.",
      },
      { property: "og:title", content: "Cadastro da Estrutura Assistencial Hospitalar" },
      {
        property: "og:description",
        content: "Emergência, internação, UTIs e UCIs em um cadastro único e organizado.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CadastroPage,
});

function Indicador({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: number | string;
}) {
  return (
    <Card className="h-full border-aghuse-green/25">
      <CardContent className="p-5 text-center">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{rotulo}</p>
        <p className="mt-2 text-3xl font-semibold text-aghuse-green">{valor}</p>

      </CardContent>

    </Card>
  );
}

function AcoesLinha({ onEditar, onRemover }: { onEditar: () => void; onRemover: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onEditar}
        className="hover:bg-triage-green/15 hover:text-triage-green"
      >
        Editar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemover}
        className="hover:bg-destructive/10 hover:text-destructive"
      >
        Remover
      </Button>
    </div>
  );
}

function AcoesEdicao({ onSalvar, onCancelar }: { onSalvar: () => void; onCancelar: () => void }) {
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={onSalvar}
        className="hover:bg-triage-green/15 hover:text-triage-green"
      >
        Salvar
      </Button>
      <Button variant="ghost" size="sm" onClick={onCancelar}>
        Cancelar
      </Button>
    </div>
  );
}

const numero = (v: string) => Math.max(0, Math.floor(Number(v) || 0));

function CadastroPage() {
  const navigate = useNavigate();
  const { user, carregando: carregandoSessao } = useAuth();
  const [dados, setDados] = useState<Cadastro>(cadastroVazio);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [empresa, setEmpresa] = useState<EmpresaCodigo | null>(null);

  useEffect(() => {
    if (carregandoSessao) return;
    if (!user) {
      navigate({ to: "/" });
      return;
    }
    const ativa = obterEmpresaAtiva();
    if (!ativa) {
      navigate({ to: "/" });
      return;
    }
    setEmpresa(ativa);
  }, [carregandoSessao, user, navigate]);

  useEffect(() => {
    if (!user || !empresa) return;
    let ativo = true;
    setCarregandoDados(true);
    carregarCadastro(user.id, empresa)
      .then((c) => ativo && setDados(c))
      .catch(() => toast.error("Não foi possível carregar sua parametrização."))
      .finally(() => ativo && setCarregandoDados(false));
    return () => {
      ativo = false;
    };
  }, [user, empresa]);



  // Emergência
  const [esp, setEsp] = useState({ nome: "", observacao: "" });
  const [area, setArea] = useState<{ tipo: AreaEmergenciaTipo; descricao: string; leitos: string }>({
    tipo: "Área Verde",
    descricao: "",
    leitos: "",
  });
  // Internação
  const [setor, setSetor] = useState({ nome: "", quartos: "", leitosPorQuarto: "" });
  // UTI/UCI
  const [uc, setUc] = useState<{
    tipo: TipoUnidadeCritica;
    perfil: PerfilUnidadeCritica;
    nome: string;
    leitos: string;
  }>({ tipo: "UTI", perfil: "Adulto", nome: "", leitos: "" });

  // Edição inline
  const [edEsp, setEdEsp] = useState<{ id: string; nome: string; observacao: string } | null>(null);
  const [edArea, setEdArea] = useState<{
    id: string;
    tipo: AreaEmergenciaTipo;
    descricao: string;
    leitos: string;
  } | null>(null);
  const [edSetor, setEdSetor] = useState<{
    id: string;
    nome: string;
    quartos: string;
    leitosPorQuarto: string;
  } | null>(null);
  const [edUc, setEdUc] = useState<{
    id: string;
    tipo: TipoUnidadeCritica;
    perfil: PerfilUnidadeCritica;
    nome: string;
    leitos: string;
  } | null>(null);

  const unidadesFiltradas = useMemo(
    () => dados.unidadesCriticas.filter((u) => u.tipo === uc.tipo),
    [dados.unidadesCriticas, uc.tipo],
  );


  const totais = useMemo(
    () => ({
      emergencia: totalLeitosEmergencia(dados),
      internacao: totalLeitosInternacao(dados),
      uti: totalLeitosCriticos(dados, "UTI"),
      uci: totalLeitosCriticos(dados, "UCI"),
      geral: totalGeralLeitos(dados),
    }),
    [dados],
  );



  const sair = useCallback(async () => {
    limparEmpresaAtiva();
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }, [navigate]);

  if (carregandoSessao || !user || !empresa) return null;

  const addEspecialidade = async () => {
    const nome = esp.nome.trim();
    if (nome.length < 3) return toast.error("Informe a especialidade (mínimo 3 caracteres).");
    if (dados.especialidades.some((e) => e.nome.toLowerCase() === nome.toLowerCase()))
      return toast.error("Especialidade já cadastrada.");
    try {
      const criada = await inserirEspecialidade(user.id, empresa, {
        nome,
        observacao: esp.observacao.trim() || null,
      });
      setDados((d) => ({ ...d, especialidades: [...d.especialidades, criada] }));
      setEsp({ nome: "", observacao: "" });
      toast.success("Especialidade salva.");
    } catch {
      toast.error("Erro ao salvar a especialidade.");
    }
  };

  const addArea = async () => {
    const leitos = numero(area.leitos);
    if (leitos < 1) return toast.error("Quantitativo de leitos deve ser maior que zero.");
    if (area.tipo === "Outra área assistencial" && area.descricao.trim().length < 3)
      return toast.error("Descreva a área assistencial.");
    try {
      const criada = await inserirArea(user.id, empresa, {
        tipo: area.tipo,
        descricao: area.descricao.trim(),
        leitos,
      });
      setDados((d) => ({ ...d, areasEmergencia: [...d.areasEmergencia, criada] }));
      setArea({ tipo: "Área Verde", descricao: "", leitos: "" });
      toast.success("Área da emergência salva.");
    } catch {
      toast.error("Erro ao salvar a área.");
    }
  };

  const addSetor = async () => {
    const quartos = numero(setor.quartos);
    const lpq = numero(setor.leitosPorQuarto);
    if (setor.nome.trim().length < 3) return toast.error("Informe o nome do setor/unidade.");
    if (quartos < 1) return toast.error("Quantitativo de quartos deve ser maior que zero.");
    if (lpq < 1) return toast.error("Leitos por quarto deve ser maior que zero.");
    try {
      const criado = await inserirSetor(user.id, empresa, {
        nome: setor.nome.trim(),
        quartos,
        leitosPorQuarto: lpq,
      });
      setDados((d) => ({ ...d, setoresInternacao: [...d.setoresInternacao, criado] }));
      setSetor({ nome: "", quartos: "", leitosPorQuarto: "" });
      toast.success("Setor de internação salvo.");
    } catch {
      toast.error("Erro ao salvar o setor.");
    }
  };

  const addUnidadeCritica = async () => {
    const leitos = numero(uc.leitos);
    if (uc.nome.trim().length < 3) return toast.error("Informe a identificação da unidade.");
    if (leitos < 1) return toast.error("Quantitativo de leitos deve ser maior que zero.");
    try {
      const criada = await inserirUnidadeCritica(user.id, empresa, {
        tipo: uc.tipo,
        perfil: uc.perfil,
        nome: uc.nome.trim(),
        leitos,
      });
      setDados((d) => ({ ...d, unidadesCriticas: [...d.unidadesCriticas, criada] }));
      setUc({ tipo: "UTI", perfil: "Adulto", nome: "", leitos: "" });
      toast.success("Unidade salva.");
    } catch {
      toast.error("Erro ao salvar a unidade.");
    }
  };

  const remover = async (chave: keyof Cadastro, id: string) => {
    try {
      await removerRegistro(chave, id);
      setDados(
        (d) =>
          ({ ...d, [chave]: (d[chave] as { id: string }[]).filter((i) => i.id !== id) }) as Cadastro,
      );
      toast.success("Registro removido.");
    } catch {
      toast.error("Erro ao remover o registro.");
    }
  };

  const salvarEsp = async () => {
    if (!edEsp) return;
    const nome = edEsp.nome.trim();
    if (nome.length < 3) return toast.error("Informe a especialidade (mínimo 3 caracteres).");
    const observacao = edEsp.observacao.trim() || null;
    try {
      await atualizarEspecialidade(edEsp.id, { nome, observacao });
      setDados((d) => ({
        ...d,
        especialidades: d.especialidades.map((e) =>
          e.id === edEsp.id ? { ...e, nome, observacao } : e,
        ),
      }));
      setEdEsp(null);
      toast.success("Especialidade atualizada.");
    } catch {
      toast.error("Erro ao atualizar a especialidade.");
    }
  };

  const salvarArea = async () => {
    if (!edArea) return;
    const leitos = numero(edArea.leitos);
    if (leitos < 1) return toast.error("Quantitativo de leitos deve ser maior que zero.");
    if (edArea.tipo === "Outra área assistencial" && edArea.descricao.trim().length < 3)
      return toast.error("Descreva a área assistencial.");
    const dadosArea = { tipo: edArea.tipo, descricao: edArea.descricao.trim(), leitos };
    try {
      await atualizarArea(edArea.id, dadosArea);
      setDados((d) => ({
        ...d,
        areasEmergencia: d.areasEmergencia.map((a) =>
          a.id === edArea.id ? { ...a, ...dadosArea } : a,
        ),
      }));
      setEdArea(null);
      toast.success("Área atualizada.");
    } catch {
      toast.error("Erro ao atualizar a área.");
    }
  };

  const salvarSetor = async () => {
    if (!edSetor) return;
    const quartos = numero(edSetor.quartos);
    const lpq = numero(edSetor.leitosPorQuarto);
    if (edSetor.nome.trim().length < 3) return toast.error("Informe o nome do setor/unidade.");
    if (quartos < 1) return toast.error("Quantitativo de quartos deve ser maior que zero.");
    if (lpq < 1) return toast.error("Leitos por quarto deve ser maior que zero.");
    const novo = { nome: edSetor.nome.trim(), quartos, leitosPorQuarto: lpq };
    try {
      await atualizarSetor(edSetor.id, novo);
      setDados((d) => ({
        ...d,
        setoresInternacao: d.setoresInternacao.map((s) =>
          s.id === edSetor.id ? { ...s, ...novo } : s,
        ),
      }));
      setEdSetor(null);
      toast.success("Setor atualizado.");
    } catch {
      toast.error("Erro ao atualizar o setor.");
    }
  };

  const salvarUc = async () => {
    if (!edUc) return;
    const leitos = numero(edUc.leitos);
    if (edUc.nome.trim().length < 3) return toast.error("Informe a identificação da unidade.");
    if (leitos < 1) return toast.error("Quantitativo de leitos deve ser maior que zero.");
    const nova = { tipo: edUc.tipo, perfil: edUc.perfil, nome: edUc.nome.trim(), leitos };
    try {
      await atualizarUnidadeCritica(edUc.id, nova);
      setDados((d) => ({
        ...d,
        unidadesCriticas: d.unidadesCriticas.map((u) => (u.id === edUc.id ? { ...u, ...nova } : u)),
      }));
      setEdUc(null);
      toast.success("Unidade atualizada.");
    } catch {
      toast.error("Erro ao atualizar a unidade.");
    }
  };



  return (
    <div className="min-h-screen overflow-x-hidden bg-background">

      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">

          <div className="min-w-0">
            <h1 className="text-base font-semibold sm:text-lg">Cadastro da Estrutura Assistencial</h1>
            <p className="truncate text-sm text-muted-foreground">
              {nomeEmpresa(empresa)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email} — emergência, internação, UTI e UCI
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">

            <Button
              className="bg-aghuse-green text-primary-foreground hover:bg-aghuse-green-deep"
              onClick={() => exportarCSV(dados)}
            >
              Exportar CSV
            </Button>
            <Button
              className="bg-aghuse-green text-primary-foreground hover:bg-aghuse-green-deep"
              onClick={() => exportarJSON(dados)}
            >
              Exportar JSON
            </Button>
            <Button
              className="bg-aghuse-green text-primary-foreground hover:bg-aghuse-green-deep"
              onClick={() => {
                if (!exportarPDF(dados, `${nomeEmpresa(empresa)} — ${user.email ?? ""}`))
                  toast.error("Permita pop-ups para visualizar o PDF.");
              }}
            >
              Exportar PDF
            </Button>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={sair}
            >
              Sair
            </Button>
          </div>
        </div>
      </header>


      {carregandoDados && (
        <p className="mx-auto max-w-6xl px-6 pt-6 text-sm text-muted-foreground">
          Carregando parametrização salva…
        </p>
      )}

      <main className="mx-auto w-full max-w-6xl space-y-8 overflow-x-hidden px-4 py-8 sm:px-6">
        <p className="rounded-md border border-aghuse-green/30 bg-aghuse-green/5 p-4 text-center text-sm text-muted-foreground">
          Observação: todo o formulário precisa ser preenchido corretamente a partir dos campos
          solicitados nos setores (Setor de Emergência, Setor de Internação e Setor UTI e UCI).
        </p>

        <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Indicador rotulo="Leitos emergência" valor={totais.emergencia} />
          <Indicador rotulo="Leitos internação" valor={totais.internacao} />
          <Indicador rotulo="Leitos UTI" valor={totais.uti} />
          <Indicador rotulo="Leitos UCI" valor={totais.uci} />
          <Indicador rotulo="Total geral" valor={totais.geral} />
        </section>


        <Tabs defaultValue="emergencia">
          <TabsList className="h-auto w-full flex-col gap-1 p-1 sm:w-auto sm:flex-row">
            <TabsTrigger value="emergencia" className="data-[state=active]:bg-aghuse-green data-[state=active]:text-primary-foreground">1. Setor de Emergência</TabsTrigger>
            <TabsTrigger value="internacao" className="data-[state=active]:bg-aghuse-green data-[state=active]:text-primary-foreground">2. Setor de Internação</TabsTrigger>
            <TabsTrigger value="criticos" className="data-[state=active]:bg-aghuse-green data-[state=active]:text-primary-foreground">3. Setor UTI e UCI</TabsTrigger>
          </TabsList>



          {/* ---------------- Emergência ---------------- */}
          <TabsContent value="emergencia" className="space-y-6 pt-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Especialidades atendidas na emergência</CardTitle>
                <CardDescription>Relação das especialidades disponíveis no setor.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[2fr_2fr_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="esp-nome">Especialidade *</Label>
                    <Input
                      id="esp-nome"
                      value={esp.nome}
                      onChange={(e) => setEsp({ ...esp, nome: e.target.value })}
                      placeholder="Ex.: Cardiologia"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="esp-obs">Observação</Label>
                    <Input
                      id="esp-obs"
                      value={esp.observacao}
                      onChange={(e) => setEsp({ ...esp, observacao: e.target.value })}
                      placeholder="Ex.: plantão 24h"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addEspecialidade}>Adicionar</Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Observação</TableHead>
                      <TableHead className="w-44" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.especialidades.map((e) =>
                      edEsp?.id === e.id ? (
                        <TableRow key={e.id}>
                          <TableCell>
                            <Input
                              value={edEsp.nome}
                              onChange={(ev) => setEdEsp({ ...edEsp, nome: ev.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={edEsp.observacao}
                              onChange={(ev) => setEdEsp({ ...edEsp, observacao: ev.target.value })}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <AcoesEdicao onSalvar={salvarEsp} onCancelar={() => setEdEsp(null)} />
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.nome}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {e.observacao ?? "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <AcoesLinha
                              onEditar={() =>
                                setEdEsp({ id: e.id, nome: e.nome, observacao: e.observacao ?? "" })
                              }
                              onRemover={() => remover("especialidades", e.id)}
                            />
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Áreas de atendimento e leitos</CardTitle>
                <CardDescription>
                  Áreas verde, amarela, vermelha, salas de observação e demais áreas assistenciais.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[1.2fr_1.6fr_0.8fr_auto]">
                  <div className="space-y-2">
                    <Label>Área *</Label>
                    <Select
                      value={area.tipo}
                      onValueChange={(v) => setArea({ ...area, tipo: v as AreaEmergenciaTipo })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS_EMERGENCIA.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area-desc">
                      Descrição {area.tipo === "Outra área assistencial" ? "*" : ""}
                    </Label>
                    <Input
                      id="area-desc"
                      value={area.descricao}
                      onChange={(e) => setArea({ ...area, descricao: e.target.value })}
                      placeholder="Identificação da área"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area-leitos">Leitos *</Label>
                    <Input
                      id="area-leitos"
                      type="number"
                      min={1}
                      value={area.leitos}
                      onChange={(e) => setArea({ ...area, leitos: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addArea}>Adicionar</Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Área</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Leitos</TableHead>
                      <TableHead className="w-44" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.areasEmergencia.map((a) =>
                      edArea?.id === a.id ? (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Select
                              value={edArea.tipo}
                              onValueChange={(v) =>
                                setEdArea({ ...edArea, tipo: v as AreaEmergenciaTipo })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AREAS_EMERGENCIA.map((x) => (
                                  <SelectItem key={x} value={x}>
                                    {x}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={edArea.descricao}
                              onChange={(ev) => setEdArea({ ...edArea, descricao: ev.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={edArea.leitos}
                              onChange={(ev) => setEdArea({ ...edArea, leitos: ev.target.value })}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <AcoesEdicao onSalvar={salvarArea} onCancelar={() => setEdArea(null)} />
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Badge variant="secondary">{a.tipo}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {a.descricao || "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium">{a.leitos}</TableCell>
                          <TableCell className="text-right">
                            <AcoesLinha
                              onEditar={() =>
                                setEdArea({
                                  id: a.id,
                                  tipo: a.tipo,
                                  descricao: a.descricao,
                                  leitos: String(a.leitos),
                                })
                              }
                              onRemover={() => remover("areasEmergencia", a.id)}
                            />
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                    <TableRow>
                      <TableCell colSpan={2} className="font-medium">
                        Total de leitos da emergência
                      </TableCell>
                      <TableCell className="text-right font-semibold">{totais.emergencia}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- Internação ---------------- */}
          <TabsContent value="internacao" className="space-y-6 pt-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Unidades/setores de internação</CardTitle>
                <CardDescription>
                  Quartos por setor e leitos por quarto — o dimensionamento total é calculado
                  automaticamente (quartos × leitos por quarto).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[2fr_0.8fr_1fr_auto]">
                  <div className="space-y-2">
                    <Label htmlFor="setor-nome">Setor/unidade *</Label>
                    <Input
                      id="setor-nome"
                      value={setor.nome}
                      onChange={(e) => setSetor({ ...setor, nome: e.target.value })}
                      placeholder="Ex.: Internação Clínica – 3º andar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setor-quartos">Quartos *</Label>
                    <Input
                      id="setor-quartos"
                      type="number"
                      min={1}
                      value={setor.quartos}
                      onChange={(e) => setSetor({ ...setor, quartos: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setor-lpq">Leitos por quarto *</Label>
                    <Input
                      id="setor-lpq"
                      type="number"
                      min={1}
                      value={setor.leitosPorQuarto}
                      onChange={(e) => setSetor({ ...setor, leitosPorQuarto: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addSetor}>Adicionar</Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setor/unidade</TableHead>
                      <TableHead className="text-right">Quartos</TableHead>
                      <TableHead className="text-right">Leitos/quarto</TableHead>
                      <TableHead className="text-right">Total de leitos</TableHead>
                      <TableHead className="w-44" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.setoresInternacao.map((s) =>
                      edSetor?.id === s.id ? (
                        <TableRow key={s.id}>
                          <TableCell>
                            <Input
                              value={edSetor.nome}
                              onChange={(ev) => setEdSetor({ ...edSetor, nome: ev.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={edSetor.quartos}
                              onChange={(ev) => setEdSetor({ ...edSetor, quartos: ev.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={edSetor.leitosPorQuarto}
                              onChange={(ev) =>
                                setEdSetor({ ...edSetor, leitosPorQuarto: ev.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {numero(edSetor.quartos) * numero(edSetor.leitosPorQuarto)}
                          </TableCell>
                          <TableCell className="text-right">
                            <AcoesEdicao
                              onSalvar={salvarSetor}
                              onCancelar={() => setEdSetor(null)}
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.nome}</TableCell>
                          <TableCell className="text-right">{s.quartos}</TableCell>
                          <TableCell className="text-right">{s.leitosPorQuarto}</TableCell>
                          <TableCell className="text-right font-medium">
                            {leitosDoSetor(s)}
                          </TableCell>
                          <TableCell className="text-right">
                            <AcoesLinha
                              onEditar={() =>
                                setEdSetor({
                                  id: s.id,
                                  nome: s.nome,
                                  quartos: String(s.quartos),
                                  leitosPorQuarto: String(s.leitosPorQuarto),
                                })
                              }
                              onRemover={() => remover("setoresInternacao", s.id)}
                            />
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                    <TableRow>
                      <TableCell colSpan={3} className="font-medium">
                        Dimensionamento total de leitos de internação
                      </TableCell>
                      <TableCell className="text-right font-semibold">{totais.internacao}</TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- UTI / UCI ---------------- */}
          <TabsContent value="criticos" className="space-y-6 pt-6">
            
            <Card>
              <CardHeader>
                <CardTitle>Terapia intensiva e cuidados intermediários</CardTitle>
                <CardDescription>
                  UTIs e UCIs por perfil assistencial (adulto, pediátrica, neonatal ou outra) e
                  respectivos leitos.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-[0.8fr_1fr_1.6fr_0.8fr_auto]">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select
                      value={uc.tipo}
                      onValueChange={(v) => setUc({ ...uc, tipo: v as TipoUnidadeCritica })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTI">UTI</SelectItem>
                        <SelectItem value="UCI">UCI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Perfil *</Label>
                    <Select
                      value={uc.perfil}
                      onValueChange={(v) => setUc({ ...uc, perfil: v as PerfilUnidadeCritica })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PERFIS_UNIDADE_CRITICA.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uc-nome">Identificação da unidade *</Label>
                    <Input
                      id="uc-nome"
                      value={uc.nome}
                      onChange={(e) => setUc({ ...uc, nome: e.target.value })}
                      placeholder="Ex.: UTI Adulto II"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="uc-leitos">Leitos *</Label>
                    <Input
                      id="uc-leitos"
                      type="number"
                      min={1}
                      value={uc.leitos}
                      onChange={(e) => setUc({ ...uc, leitos: e.target.value })}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addUnidadeCritica}>Adicionar</Button>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  Exibindo apenas os registros de <span className="font-medium">{uc.tipo}</span>.
                  Altere o campo “Tipo” para ver os dados da outra modalidade.
                </p>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Leitos</TableHead>
                      <TableHead className="w-44" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unidadesFiltradas.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-muted-foreground">
                          Nenhuma {uc.tipo} cadastrada.
                        </TableCell>
                      </TableRow>
                    )}
                    {unidadesFiltradas.map((u) =>
                      edUc?.id === u.id ? (
                        <TableRow key={u.id}>
                          <TableCell>
                            <Select
                              value={edUc.tipo}
                              onValueChange={(v) =>
                                setEdUc({ ...edUc, tipo: v as TipoUnidadeCritica })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="UTI">UTI</SelectItem>
                                <SelectItem value="UCI">UCI</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={edUc.perfil}
                              onValueChange={(v) =>
                                setEdUc({ ...edUc, perfil: v as PerfilUnidadeCritica })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {PERFIS_UNIDADE_CRITICA.map((p) => (
                                  <SelectItem key={p} value={p}>
                                    {p}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={edUc.nome}
                              onChange={(ev) => setEdUc({ ...edUc, nome: ev.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              value={edUc.leitos}
                              onChange={(ev) => setEdUc({ ...edUc, leitos: ev.target.value })}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <AcoesEdicao onSalvar={salvarUc} onCancelar={() => setEdUc(null)} />
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow key={u.id}>
                          <TableCell>
                            <Badge variant={u.tipo === "UTI" ? "default" : "secondary"}>
                              {u.tipo}
                            </Badge>
                          </TableCell>
                          <TableCell>{u.perfil}</TableCell>
                          <TableCell className="font-medium">{u.nome}</TableCell>
                          <TableCell className="text-right font-medium">{u.leitos}</TableCell>
                          <TableCell className="text-right">
                            <AcoesLinha
                              onEditar={() =>
                                setEdUc({
                                  id: u.id,
                                  tipo: u.tipo,
                                  perfil: u.perfil,
                                  nome: u.nome,
                                  leitos: String(u.leitos),
                                })
                              }
                              onRemover={() => remover("unidadesCriticas", u.id)}
                            />
                          </TableCell>
                        </TableRow>
                      ),
                    )}
                    <TableRow>
                      <TableCell colSpan={3} className="font-medium">
                        Total de leitos de {uc.tipo}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {uc.tipo === "UTI" ? totais.uti : totais.uci}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
