import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/use-auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import logoAghUse from "@/assets/aghuse2-2-2.png.asset.json";
import logosRodape from "@/assets/logos-rodape.png.asset.json";
import {
  EMPRESAS,
  definirEmpresaAtiva,
  obterEmpresaAtiva,
  type EmpresaCodigo,
} from "@/lib/empresas";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { next?: string } => ({
    next: typeof s.next === "string" && s.next.startsWith("/") && !s.next.startsWith("//") ? s.next : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Login | Cadastro de Estrutura Assistencial" },
      {
        name: "description",
        content:
          "Acesso ao sistema de cadastro e parametrização da estrutura assistencial hospitalar: emergência, internação, UTI e UCI.",
      },
      { property: "og:title", content: "Login | Cadastro de Estrutura Assistencial" },
      {
        property: "og:description",
        content: "Acesso ao sistema de cadastro e parametrização da estrutura assistencial hospitalar: emergência, internação, UTI e UCI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const irParaDestino = () => {
    if (next) {
      window.location.href = next;
      return;
    }
    navigate({ to: "/cadastro" });
  };
  const { user, carregando } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [empresa, setEmpresa] = useState<EmpresaCodigo | "">("");

  useEffect(() => {
    setEmpresa(obterEmpresaAtiva() ?? "");
  }, []);

  const validarEmpresa = () => {
    if (!empresa) {
      toast.error("Selecione a empresa (hospital) para continuar.");
      return false;
    }
    definirEmpresaAtiva(empresa);
    return true;
  };

  useEffect(() => {
    if (!carregando && user && obterEmpresaAtiva()) irParaDestino();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregando, user, next]);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarEmpresa()) return;
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) return toast.error("Não foi possível entrar: " + error.message);
    toast.success("Usuário Logado Com Sucesso!");
    irParaDestino();
  };


  const cadastrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarEmpresa()) return;
    if (senha.length < 6) return toast.error("A senha deve ter no mínimo 6 caracteres.");
    setEnviando(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: { emailRedirectTo: window.location.origin + (next ?? ""), data: { nome: nome.trim() } },
    });
    setEnviando(false);
    if (error) return toast.error("Não foi possível criar a conta: " + error.message);
    if (!data.session) {
      toast.success("Conta criada. Confirme o e-mail enviado para concluir o acesso.");
      return;
    }
    toast.success("Usuário Logado Com Sucesso!");
    irParaDestino();
  };

  const entrarComGoogle = async () => {
    if (!validarEmpresa()) return;
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + (next ?? ""),
    });
    if (result.error) return toast.error("Falha no login com Google.");
    if (result.redirected) return;
    toast.success("Usuário Logado Com Sucesso!");
    irParaDestino();
  };


  return (
    <main className="grid h-screen overflow-hidden lg:grid-cols-2">
      <section className="relative hidden flex-col overflow-hidden bg-aghuse-green text-primary-foreground lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='208' viewBox='0 0 120 208'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='0.35' stroke-width='2'%3E%3Cpath d='M60 4 112 34 112 94 60 124 8 94 8 34Z'/%3E%3Cpath d='M0 108 52 138 52 198 0 228'/%3E%3Cpath d='M120 108 68 138 68 198 120 228'/%3E%3C/g%3E%3Cg fill='%23ffffff' fill-opacity='0.18'%3E%3Ccircle cx='60' cy='150' r='4'/%3E%3Cpath d='M104 150h10v-10h10v10h10v10h-10v10h-10v-10h-10z'/%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "180px 312px",
          }}
        />

        <div className="relative flex flex-1 flex-col justify-center px-6 py-10 xl:px-10">
          <p className="font-bold tracking-[0.2em] uppercase opacity-90 whitespace-pre-line">
            <span className="text-base">PARAMETRIZAÇÃO ASSISTENCIAL</span>
            {"\n"}
            <span className="text-xs">GERENCIA DE TECNOLOGIA DA INFORMAÇÃO (GTI)</span>
          </p>
          <div className="mt-6 space-y-4">
            <h1 className="text-3xl font-semibold leading-[1.15] xl:text-4xl">
              Estrutura física e fluxo assistencial em um único cadastro
            </h1>
            <div className="flex flex-wrap gap-3 text-sm font-medium">
              <span className="rounded-md bg-primary-foreground/15 px-3 py-1">Setor Emergência</span>
              <span className="rounded-md bg-primary-foreground/15 px-3 py-1">Setor Internação</span>
              <span className="rounded-md bg-primary-foreground/15 px-3 py-1">Setor UTI e UCI</span>
            </div>
            <p className="max-w-md text-base leading-snug opacity-90">
              O objetivo dessa ferramenta é realizar a coleta dos dados necessários para
              parametrização do AGHUse.
            </p>
          </div>
        </div>

      </section>



      <section className="flex items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-sm space-y-4">

          <div className="flex justify-center">
            <img
              src={logoAghUse.url}
              alt="AGHUse — Secretaria de Estado da Saúde, Governo da Paraíba"
              className="h-20 w-auto"
            />
          </div>
          <header className="space-y-1 text-center">
            <h2 className="text-2xl font-semibold">Sistema de Cadastro</h2>
            <p className="text-sm text-muted-foreground">
              Entre com sua conta para realizar o cadastro ou carregar sua parametrização salva.
            </p>
          </header>


          <div className="space-y-2">
            <Label htmlFor="empresa">Empresa (hospital) *</Label>
            <Select value={empresa || undefined} onValueChange={(v) => setEmpresa(v as EmpresaCodigo)}>
              <SelectTrigger id="empresa">
                <SelectValue placeholder="Selecione o hospital" />
              </SelectTrigger>
              <SelectContent>
                {EMPRESAS.map((e) => (
                  <SelectItem key={e.codigo} value={e.codigo}>
                    {e.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Os dados cadastrados ficam isolados por hospital.
            </p>
          </div>

          <Tabs defaultValue="entrar">
            <TabsList className="w-full">
              <TabsTrigger value="entrar" className="flex-1">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="criar" className="flex-1">
                Criar conta
              </TabsTrigger>
            </TabsList>

            <TabsContent value="entrar">
              <form onSubmit={entrar} className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#DCE0DC] text-foreground shadow-sm hover:bg-[#F5F5F5] hover:shadow-md hover:scale-[1.01] transition-all duration-200"
                  disabled={enviando}
                >
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="criar">
              <form onSubmit={cadastrar} className="space-y-3 pt-3">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome</Label>
                  <Input
                    id="nome"
                    value={nome}
                    autoComplete="name"
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-novo">E-mail</Label>
                  <Input
                    id="email-novo"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="senha-nova">Senha</Label>
                  <Input
                    id="senha-nova"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={enviando}>
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            className="w-full bg-[#DCE0DC] text-foreground shadow-sm hover:bg-[#F5F5F5] hover:shadow-md hover:scale-[1.01] transition-all duration-200"
            onClick={entrarComGoogle}
          >
            Continuar com Google
          </Button>

          <div className="flex justify-center pt-4">
            <img
              src={logosRodape.url}
              alt="AGHUse, Conecta SUS PB, ESP, Secretaria de Estado da Saúde e Governo da Paraíba"
              className="h-20 w-full max-w-lg object-contain sm:h-24"
              loading="lazy"
            />
          </div>

        </div>
      </section>
    </main>
  );
}
