import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s.authorization_id === "string" ? s.authorization_id : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Parâmetro authorization_id ausente.");
    const { data } = await supabase.auth.getSession();
    const next = location.pathname + location.searchStr;
    if (!data.session) throw redirect({ to: "/", search: { next } });
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="mx-auto max-w-md space-y-2 p-10">
      <h1 className="text-xl font-semibold">Não foi possível carregar a autorização</h1>
      <p className="text-muted-foreground text-sm">{String((error as Error)?.message ?? error)}</p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nome = details?.client?.name ?? "o aplicativo";

  async function decidir(aprovar: boolean) {
    setBusy(true);
    setErro(null);
    const { data, error } = aprovar
      ? await supabase.auth.oauth.approveAuthorization(authorization_id)
      : await supabase.auth.oauth.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setErro(error.message);
      return;
    }
    const destino = data?.redirect_url ?? data?.redirect_to;
    if (!destino) {
      setBusy(false);
      setErro("O servidor de autorização não retornou um redirecionamento.");
      return;
    }
    window.location.href = destino;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Conectar {nome} à sua conta</h1>
        <p className="text-muted-foreground text-sm">
          {nome} poderá consultar e alterar a sua parametrização assistencial (emergência, internação,
          UTI e UCI) agindo como você.
        </p>
      </div>
      {erro && (
        <p role="alert" className="text-destructive text-sm">
          {erro}
        </p>
      )}
      <div className="flex gap-3">
        <Button disabled={busy} onClick={() => decidir(true)}>
          Autorizar
        </Button>
        <Button variant="outline" disabled={busy} onClick={() => decidir(false)}>
          Recusar
        </Button>
      </div>
    </main>
  );
}
