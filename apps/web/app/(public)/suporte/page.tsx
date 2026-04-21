export const metadata = { title: 'Suporte — MyFitLife' };

export default function SuportePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Suporte</h1>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Precisa de ajuda?</h2>
        <p className="text-sm text-muted-foreground">
          Envie um email para{' '}
          <a
            href="mailto:suporte@myfitlife.app"
            className="text-accent underline"
          >
            suporte@myfitlife.app
          </a>{' '}
          ou use o coach IA dentro do app.
        </p>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Perguntas frequentes</h2>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium py-2">
            Como cancelo minha assinatura?
          </summary>
          <p className="text-sm text-muted-foreground pb-2 pl-4">
            Vá em Configurações &rarr; Assinatura &rarr; Cancelar. Você pode
            cancelar a qualquer momento.
          </p>
        </details>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium py-2">
            Como exporto meus dados?
          </summary>
          <p className="text-sm text-muted-foreground pb-2 pl-4">
            Vá em Configurações &rarr; Privacidade &rarr; Exportar dados.
            Conforme a LGPD.
          </p>
        </details>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium py-2">
            O reconhecimento de alimentos por foto funciona offline?
          </summary>
          <p className="text-sm text-muted-foreground pb-2 pl-4">
            Não, a análise de foto precisa de conexão com a internet para
            processar a imagem.
          </p>
        </details>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium py-2">
            Como conecto meu Fitbit/WHOOP?
          </summary>
          <p className="text-sm text-muted-foreground pb-2 pl-4">
            Vá em Configurações &rarr; Saúde &rarr; Wearables &rarr; Conectar.
            Você será redirecionado para o site do fabricante para autorizar.
          </p>
        </details>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium py-2">
            O app funciona no Apple Watch?
          </summary>
          <p className="text-sm text-muted-foreground pb-2 pl-4">
            Sim! Adicione as complicações MyFitLife no seu watch face para ver
            streak, readiness e treino do dia.
          </p>
        </details>

        <details className="group">
          <summary className="cursor-pointer text-sm font-medium py-2">
            Como deleto minha conta?
          </summary>
          <p className="text-sm text-muted-foreground pb-2 pl-4">
            Vá em Configurações &rarr; Perfil &rarr; Excluir conta. Todos os
            dados são removidos permanentemente em até 30 dias.
          </p>
        </details>
      </section>

      <p className="text-xs text-muted-foreground text-center">
        MyFitLife Tecnologia LTDA &middot; Presidente Prudente, SP &middot;
        Brasil
      </p>
    </main>
  );
}
