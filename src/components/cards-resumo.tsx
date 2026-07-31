import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  leitosDoSetor,
  totalLeitosEmergencia,
  totalLeitosInternacao,
  type Cadastro,
} from "@/lib/cadastro-store";

function CardResumo({
  titulo,
  destaque,
  legenda,
  children,
}: {
  titulo: string;
  destaque?: number | string;
  legenda?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {destaque !== undefined && <p className="text-3xl font-semibold">{destaque}</p>}
        {legenda && <p className="text-xs text-muted-foreground">{legenda}</p>}
        {children}
      </CardContent>
    </Card>
  );
}

function Lista({ itens }: { itens: { chave: string; rotulo: string; valor: string | number }[] }) {
  if (itens.length === 0)
    return <p className="text-xs text-muted-foreground">Nenhum registro cadastrado.</p>;
  return (
    <ul className="space-y-1 text-sm">
      {itens.map((i) => (
        <li key={i.chave} className="flex items-center justify-between gap-3">
          <span className="truncate">{i.rotulo}</span>
          <span className="font-medium tabular-nums">{i.valor}</span>
        </li>
      ))}
    </ul>
  );
}

export function CardsEmergencia({ dados }: { dados: Cadastro }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <CardResumo
        titulo="Especialidades atendidas na emergência"
        destaque={dados.especialidades.length}
        legenda="Especialidades cadastradas por você"
      >
        <div className="flex flex-wrap gap-1.5">
          {dados.especialidades.map((e) => (
            <Badge key={e.id} variant="secondary">
              {e.nome}
            </Badge>
          ))}
        </div>
      </CardResumo>
      <CardResumo
        titulo="Áreas de atendimento e leitos"
        destaque={dados.areasEmergencia.length}
        legenda={`${totalLeitosEmergencia(dados)} leito(s) na emergência`}
      >
        <Lista
          itens={dados.areasEmergencia.map((a) => ({
            chave: a.id,
            rotulo: a.descricao ? `${a.tipo} — ${a.descricao}` : a.tipo,
            valor: `${a.leitos} leito(s)`,
          }))}
        />
      </CardResumo>
    </section>
  );
}

export function CardsInternacao({ dados }: { dados: Cadastro }) {
  const setores = dados.setoresInternacao;
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CardResumo
        titulo="Unidades/setores de internação"
        destaque={setores.length}
        legenda="Setores cadastrados"
      >
        <Lista itens={setores.map((s) => ({ chave: s.id, rotulo: s.nome, valor: "" }))} />
      </CardResumo>
      <CardResumo
        titulo="Quartos por setor"
        destaque={setores.reduce((t, s) => t + s.quartos, 0)}
        legenda="Total de quartos"
      >
        <Lista
          itens={setores.map((s) => ({ chave: s.id, rotulo: s.nome, valor: `${s.quartos} quarto(s)` }))}
        />
      </CardResumo>
      <CardResumo titulo="Leitos por quarto" legenda="Configuração de cada setor">
        <Lista
          itens={setores.map((s) => ({
            chave: s.id,
            rotulo: s.nome,
            valor: `${s.leitosPorQuarto} leito(s)/quarto`,
          }))}
        />
      </CardResumo>
      <CardResumo
        titulo="Dimensionamento total de leitos"
        destaque={totalLeitosInternacao(dados)}
        legenda="Discriminado por setor/unidade"
      >
        <Lista
          itens={setores.map((s) => ({
            chave: s.id,
            rotulo: s.nome,
            valor: `${leitosDoSetor(s)} leito(s)`,
          }))}
        />
      </CardResumo>
    </section>
  );
}

export function CardsCriticos({ dados }: { dados: Cadastro }) {
  const utis = dados.unidadesCriticas.filter((u) => u.tipo === "UTI");
  const ucis = dados.unidadesCriticas.filter((u) => u.tipo === "UCI");
  const porPerfil = (lista: typeof utis) => {
    const mapa = new Map<string, number>();
    for (const u of lista) mapa.set(u.perfil, (mapa.get(u.perfil) ?? 0) + 1);
    return [...mapa.entries()].map(([perfil, qtd]) => ({
      chave: perfil,
      rotulo: perfil,
      valor: `${qtd} unidade(s)`,
    }));
  };

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <CardResumo
        titulo="UTIs existentes"
        destaque={utis.length}
        legenda="Por perfil assistencial"
      >
        <Lista itens={porPerfil(utis)} />
      </CardResumo>
      <CardResumo
        titulo="Leitos por UTI"
        destaque={utis.reduce((t, u) => t + u.leitos, 0)}
        legenda="Total de leitos de UTI"
      >
        <Lista
          itens={utis.map((u) => ({
            chave: u.id,
            rotulo: `${u.nome} (${u.perfil})`,
            valor: `${u.leitos} leito(s)`,
          }))}
        />
      </CardResumo>
      <CardResumo
        titulo="UCIs existentes"
        destaque={ucis.length}
        legenda="Unidades de cuidados intermediários"
      >
        <Lista itens={porPerfil(ucis)} />
      </CardResumo>
      <CardResumo
        titulo="Leitos por UCI"
        destaque={ucis.reduce((t, u) => t + u.leitos, 0)}
        legenda="Total de leitos de UCI"
      >
        <Lista
          itens={ucis.map((u) => ({
            chave: u.id,
            rotulo: `${u.nome} (${u.perfil})`,
            valor: `${u.leitos} leito(s)`,
          }))}
        />
      </CardResumo>
    </section>
  );
}
