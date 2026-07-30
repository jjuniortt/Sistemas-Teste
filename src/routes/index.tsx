import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { autenticar, sessaoAtual, USUARIO_DEMO } from "@/lib/cadastro-store";

export const Route = createFileRoute("/")({
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
        content: "Acesso ao sistema de parametrização da estrutura assistencial hospitalar.",
      },
    ],
  }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (sessaoAtual()) navigate({ to: "/cadastro" });
  }, [navigate]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !senha) {
      setErro("Informe usuário e senha.");
      return;
    }
    if (!autenticar(usuario, senha)) {
      setErro("Credenciais inválidas.");
      return;
    }
    navigate({ to: "/cadastro" });
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
        <p className="text-sm font-medium tracking-[0.2em] uppercase opacity-80">
          Parametrização assistencial
        </p>
        <div className="space-y-6">
          <h1 className="text-5xl leading-tight font-semibold">
            Estrutura física e fluxo assistencial em um único cadastro
          </h1>
          <p className="max-w-md text-base opacity-80">
            Emergência, internação, UTIs e UCIs organizados conforme a solicitação de
            informações para parametrização do sistema.
          </p>
        </div>
        <div className="flex gap-8 text-sm opacity-80">
          <span>Emergência</span>
          <span>Internação</span>
          <span>UTI / UCI</span>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={enviar} className="w-full max-w-sm space-y-6">
          <header className="space-y-2">
            <h2 className="text-2xl font-semibold">Acessar o sistema</h2>
            <p className="text-sm text-muted-foreground">
              Use as credenciais de demonstração para entrar.
            </p>
          </header>

          <div className="space-y-2">
            <Label htmlFor="usuario">Usuário</Label>
            <Input
              id="usuario"
              value={usuario}
              autoComplete="username"
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="admin"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              autoComplete="current-password"
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {erro && <p className="text-sm text-destructive">{erro}</p>}

          <Button type="submit" className="w-full">
            Entrar
          </Button>

          <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Demonstração — usuário <strong>{USUARIO_DEMO.usuario}</strong> / senha{" "}
            <strong>{USUARIO_DEMO.senha}</strong>. Autenticação estática, sem backend.
          </p>
        </form>
      </section>
    </main>
  );
}
