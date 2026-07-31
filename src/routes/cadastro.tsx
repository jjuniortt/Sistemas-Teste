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
    <Card className="h-full">
      <CardContent className="p-5">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{rotulo}</p>
        <p className="mt-2 text-3xl font-semibold">{valor}</p>
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

  useEffect(() => {
    if (!carregandoSessao && !user) navigate({ to: "/" });
  }, [carregandoSessao, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let ativo = true;
    setCarregandoDados(true);
    carregarCadastro(user.id)
      .then((c) => ativo && setDados(c))
      .catch(() => toast.error("Não foi possível carregar sua parametrização."))
      .finally(() => ativo && setCarregandoDados(false));
    return () => {
      ativo = false;
    };
  }, [user]);

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
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }, [navigate]);

  if (carregandoSessao || !user) return null;

  const addEspecialidade = async () => {
    const nome = esp.nome.trim();
    if (nome.length < 3) return toast.error("Informe a especialidade (mínimo 3 caracteres).");
    if (dados.especialidades.some((e) => e.nome.toLowerCase() === nome.toLowerCase()))
      return toast.error("Especialidade já cadastrada.");
    try {
      const criada = await inserirEspecialidade(user.id, {
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
      const criada = await inserirArea(user.id, {
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
      const criado = await inserirSetor(user.id, {
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
      const criada = await inserirUnidadeCritica(user.id, {
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-lg font-semibold">Cadastro da Estrutura Assistencial</h1>
            <p className="text-sm text-muted-foreground">
              {user.email} — emergência, internação, UTI e UCI
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportarCSV(dados)}>
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => exportarJSON(dados)}>
              Exportar JSON
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (!exportarPDF(dados, user.email ?? undefined))
                  toast.error("Permita pop-ups para visualizar o PDF.");
              }}
            >
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={sair}>

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

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-8">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Indicador rotulo="Leitos emergência" valor={totais.emergencia} />
          <Indicador rotulo="Leitos internação" valor={totais.internacao} />
          <Indicador rotulo="Leitos UTI" valor={totais.uti} />
          <Indicador rotulo="Leitos UCI" valor={totais.uci} />
          <Indicador rotulo="Total geral" valor={totais.geral} />
        </section>


        <Tabs defaultValue="emergencia">
          <TabsList>
            <TabsTrigger value="emergencia">1. Emergência</TabsTrigger>
            <TabsTrigger value="internacao">2. Internação</TabsTrigger>
            <TabsTrigger value="criticos">3. UTI e UCI</TabsTrigger>
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
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.areasEmergencia.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <Badge variant="secondary">{a.tipo}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{a.descricao || "—"}</TableCell>
                        <TableCell className="text-right font-medium">{a.leitos}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remover("areasEmergencia", a.id)}
                          >
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.setoresInternacao.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.nome}</TableCell>
                        <TableCell className="text-right">{s.quartos}</TableCell>
                        <TableCell className="text-right">{s.leitosPorQuarto}</TableCell>
                        <TableCell className="text-right font-medium">{leitosDoSetor(s)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remover("setoresInternacao", s.id)}
                          >
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Leitos</TableHead>
                      <TableHead className="w-24" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dados.unidadesCriticas.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <Badge variant={u.tipo === "UTI" ? "default" : "secondary"}>{u.tipo}</Badge>
                        </TableCell>
                        <TableCell>{u.perfil}</TableCell>
                        <TableCell className="font-medium">{u.nome}</TableCell>
                        <TableCell className="text-right font-medium">{u.leitos}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => remover("unidadesCriticas", u.id)}
                          >
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="font-medium">
                        Total de leitos críticos (UTI + UCI)
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {totais.uti + totais.uci}
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
