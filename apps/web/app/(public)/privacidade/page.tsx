import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade — MyFitLife',
};

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <article className="prose prose-slate prose-invert max-w-none">
        <h1 className="text-3xl font-bold">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <p>Esta Política descreve como o MyFitLife coleta, usa, compartilha e protege seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018 — LGPD).</p>

          <h2 className="text-xl font-semibold">1. Controlador dos dados</h2>
          <p>O MyFitLife atua como controlador dos dados pessoais tratados no aplicativo. Contato do encarregado (DPO): <a href="mailto:dpo@myfitlife.app" className="text-primary underline">dpo@myfitlife.app</a></p>

          <h2 className="text-xl font-semibold">2. Dados que coletamos</h2>
          <p><strong>Dados de cadastro:</strong> nome, email, cidade, estado.</p>
          <p><strong>Dados de saúde e fitness (categoria especial):</strong> idade, sexo, peso, altura, % gordura, objetivo, histórico de lesões, restrições alimentares, nível de atividade, sono, humor, energia.</p>
          <p><strong>Dados de uso:</strong> refeições registradas, treinos realizados, conversas com o coach de IA, interações com o aplicativo.</p>
          <p><strong>Fotos:</strong> capturadas para reconhecimento de alimentos/aparelhos e fotos de progresso. Processadas via API Claude (Anthropic). Não armazenadas permanentemente pela Anthropic.</p>
          <p><strong>Localização:</strong> localização aproximada para check-in em academias; localização precisa durante GPS tracking de corrida. Coletadas apenas com consentimento explícito.</p>
          <p><strong>Dados de pagamento:</strong> processados por Stripe e PagarMe. O MyFitLife não armazena números de cartão.</p>
          <p><strong>Dados técnicos:</strong> endereço IP, tipo de dispositivo, identificador do aplicativo, push token (Firebase), logs de acesso.</p>

          <h2 className="text-xl font-semibold">3. Finalidades do tratamento</h2>
          <ul className="list-inside list-disc space-y-1">
            <li>Criar e gerenciar sua conta;</li>
            <li>Calcular metas nutricionais e gerar planos de treino personalizados;</li>
            <li>Fornecer recomendações por inteligência artificial;</li>
            <li>Registrar seu progresso e histórico;</li>
            <li>Comunicar novidades, atualizações e suporte;</li>
            <li>Cumprir obrigações legais e regulatórias;</li>
            <li>Prevenir fraude, abuso e proteger a plataforma.</li>
          </ul>

          <h2 className="text-xl font-semibold">4. Bases legais (LGPD art. 7º e 11)</h2>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Execução de contrato</strong> — para operar o serviço contratado por você;</li>
            <li><strong>Consentimento específico</strong> — para dados de saúde (art. 11, I), tratados apenas com sua autorização expressa no cadastro;</li>
            <li><strong>Legítimo interesse</strong> — para segurança, prevenção a fraudes e melhorias do serviço;</li>
            <li><strong>Cumprimento de obrigação legal</strong> — guarda de registros conforme Marco Civil da Internet.</li>
          </ul>

          <h2 className="text-xl font-semibold">5. Compartilhamento de dados</h2>
          <p>Compartilhamos dados apenas quando necessário e com operadores contratualmente obrigados a seguir a LGPD:</p>
          <ul className="list-inside list-disc space-y-1">
            <li><strong>Supabase</strong> — banco de dados, autenticação e armazenamento;</li>
            <li><strong>Anthropic (Claude)</strong> — processamento de linguagem para onboarding, coach e Autopilot. Enviamos mensagens e contexto do perfil necessários à resposta; não enviamos email ou senha;</li>
            <li><strong>Vercel</strong> — hospedagem e entrega do aplicativo;</li>
            <li><strong>Stripe e PagarMe</strong> — processamento de pagamentos (Pix, cartão, boleto);</li>
            <li><strong>Resend</strong> — envio de emails transacionais;</li>
            <li><strong>Sentry</strong> — relatório de erros (sem dados pessoais de saúde);</li>
            <li><strong>PostHog</strong> — analytics de uso (sem dados de saúde);</li>
            <li><strong>Firebase</strong> — push notifications (token do dispositivo);</li>
            <li><strong>Autoridades</strong> — quando exigido por lei ou ordem judicial.</li>
          </ul>
          <p>Não vendemos seus dados. Não compartilhamos com anunciantes.</p>

          <h2 className="text-xl font-semibold">6. Transferência internacional</h2>
          <p>Alguns parceiros (Anthropic, Vercel) processam dados em servidores fora do Brasil. As transferências ocorrem com garantias adequadas conforme LGPD art. 33, incluindo contratos padrão e medidas técnicas de segurança.</p>

          <h2 className="text-xl font-semibold">7. Retenção</h2>
          <p>Mantemos seus dados enquanto sua conta estiver ativa. Após a exclusão da conta:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Dados de perfil e saúde são removidos em até 30 dias;</li>
            <li>Registros de acesso são mantidos por 6 meses (Marco Civil da Internet);</li>
            <li>Dados fiscais de assinatura, quando aplicáveis, por 5 anos (legislação tributária).</li>
          </ul>

          <h2 className="text-xl font-semibold">8. Seus direitos (LGPD art. 18)</h2>
          <p>Você pode, a qualquer momento:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Confirmar a existência de tratamento;</li>
            <li>Acessar seus dados;</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados;</li>
            <li>Solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>Solicitar portabilidade (exportação em formato aberto);</li>
            <li>Revogar consentimento;</li>
            <li>Solicitar exclusão da conta e dos dados;</li>
            <li>Obter informação sobre compartilhamento.</li>
          </ul>
          <p>Muitos desses direitos podem ser exercidos diretamente no aplicativo em <strong>Perfil → Editar / Exportar dados / Excluir minha conta</strong>. Para demais solicitações: <a href="mailto:dpo@myfitlife.app" className="text-primary underline">dpo@myfitlife.app</a></p>

          <h2 className="text-xl font-semibold">9. Segurança</h2>
          <p>Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia em trânsito (TLS), senhas com hash, controle de acesso baseado em papéis, isolamento por usuário via Row Level Security, logs de auditoria e backups regulares.</p>
          <p>Em caso de incidente de segurança com risco relevante, comunicaremos você e a ANPD nos termos legais.</p>

          <h2 className="text-xl font-semibold">10. Crianças e adolescentes</h2>
          <p>O MyFitLife não é destinado a menores de 16 anos. Se tomarmos conhecimento de cadastro indevido de menor, a conta será removida.</p>

          <h2 className="text-xl font-semibold">11. Cookies e tecnologias similares</h2>
          <p>Usamos cookies essenciais para autenticação e funcionamento do aplicativo. Não usamos cookies de rastreamento publicitário.</p>

          <h2 className="text-xl font-semibold">12. Alterações</h2>
          <p>Alterações materiais nesta Política serão comunicadas no aplicativo ou por email. A data no topo indica a última versão.</p>

          <h2 className="text-xl font-semibold">13. Contato e reclamações</h2>
          <p>Dúvidas ou exercício de direitos: <a href="mailto:dpo@myfitlife.app" className="text-primary underline">dpo@myfitlife.app</a></p>
          <p>Você também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados (ANPD): <a href="https://www.gov.br/anpd" target="_blank" rel="noopener" className="text-primary underline">www.gov.br/anpd</a></p>
        </section>
      </article>
    </main>
  );
}
