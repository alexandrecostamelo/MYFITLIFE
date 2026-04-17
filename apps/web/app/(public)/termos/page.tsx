import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Termos de Uso — MyFitLife',
};

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>

      <article className="prose prose-slate max-w-none">
        <h1 className="text-3xl font-bold">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

        <section className="mt-8 space-y-4 text-sm leading-relaxed">
          <h2 className="text-xl font-semibold">1. Sobre o MyFitLife</h2>
          <p>O MyFitLife é um aplicativo de saúde e bem-estar que oferece ferramentas de acompanhamento nutricional, registro de treinos, orientação via inteligência artificial e organização de rotina saudável.</p>
          <p>Ao usar o aplicativo você concorda integralmente com estes Termos de Uso e com a Política de Privacidade.</p>

          <h2 className="text-xl font-semibold">2. Aviso importante sobre saúde</h2>
          <p>O MyFitLife <strong>não substitui</strong> profissionais de saúde. Informações fornecidas pelo aplicativo, incluindo recomendações geradas por IA, são de caráter educacional e organizacional.</p>
          <p>Consulte médico, nutricionista, educador físico ou outro profissional habilitado antes de iniciar dietas, treinos ou mudanças relevantes na rotina, especialmente se você tem condições de saúde, está grávida, é menor de 18 anos ou idoso.</p>
          <p>Em caso de dor, mal-estar, lesão ou qualquer sintoma preocupante, interrompa o exercício imediatamente e procure atendimento médico.</p>

          <h2 className="text-xl font-semibold">3. Elegibilidade</h2>
          <p>Para usar o MyFitLife você deve ter pelo menos 16 anos. Menores de 18 anos precisam de autorização dos responsáveis legais.</p>

          <h2 className="text-xl font-semibold">4. Conta do usuário</h2>
          <p>Você é responsável pela veracidade das informações fornecidas, pela segurança da sua senha e por todas as atividades realizadas em sua conta. Informe-nos imediatamente em caso de acesso não autorizado.</p>

          <h2 className="text-xl font-semibold">5. Uso permitido</h2>
          <p>Você pode usar o MyFitLife para fins pessoais, não comerciais. Não é permitido:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>Fazer engenharia reversa, descompilar ou extrair código-fonte;</li>
            <li>Usar o serviço para prejudicar terceiros, promover violência, discurso de ódio, fraude ou atividades ilegais;</li>
            <li>Raspar dados em massa, sobrecarregar servidores ou burlar limites técnicos;</li>
            <li>Revender ou redistribuir conteúdo sem autorização;</li>
            <li>Usar contas falsas, se passar por outra pessoa ou fornecer informações enganosas.</li>
          </ul>

          <h2 className="text-xl font-semibold">6. Conteúdo gerado por IA</h2>
          <p>Recomendações de treino, dieta, sugestões de cardápio e respostas do coach virtual são geradas por modelos de inteligência artificial (Claude, da Anthropic). Essas recomendações podem conter imprecisões e não levam em conta condições individuais que não tenham sido informadas.</p>
          <p>Use a IA como ponto de partida, não como decisão final. Validamos regras de segurança nos prompts, mas você é responsável pelo uso que faz das sugestões.</p>

          <h2 className="text-xl font-semibold">7. Conteúdo do usuário</h2>
          <p>Você mantém a propriedade dos dados que insere (peso, refeições, treinos, fotos, notas). Ao inserir dados você nos concede licença limitada para processá-los exclusivamente para operar o serviço.</p>

          <h2 className="text-xl font-semibold">8. Planos pagos e cancelamento</h2>
          <p>Quando o MyFitLife oferecer planos pagos, os preços, formas de cobrança e política de reembolso estarão descritos na tela de pagamento. Você pode cancelar a assinatura a qualquer momento pela própria aplicação; o acesso permanece ativo até o fim do ciclo pago.</p>
          <p>Nos termos do Código de Defesa do Consumidor, compras efetuadas pela internet podem ser canceladas em até 7 dias com reembolso integral.</p>

          <h2 className="text-xl font-semibold">9. Suspensão e encerramento</h2>
          <p>Podemos suspender ou encerrar sua conta em caso de violação destes Termos, fraude, abuso ou risco à plataforma ou outros usuários. Você pode encerrar sua conta a qualquer momento pelo menu Perfil → Excluir minha conta.</p>

          <h2 className="text-xl font-semibold">10. Limitação de responsabilidade</h2>
          <p>O MyFitLife é fornecido &quot;como está&quot;. Não garantimos disponibilidade ininterrupta, ausência de erros ou resultados específicos de saúde/fitness.</p>
          <p>Não somos responsáveis por danos indiretos decorrentes do uso do serviço, incluindo lesões, perda de peso não atingida, insatisfação com recomendações ou perda de dados por problemas técnicos de terceiros.</p>
          <p>Nossa responsabilidade civil, quando aplicável, fica limitada ao valor efetivamente pago pelo usuário nos últimos 12 meses.</p>

          <h2 className="text-xl font-semibold">11. Propriedade intelectual</h2>
          <p>Marca, logo, código, design e todo o conteúdo original do MyFitLife pertencem aos seus titulares e são protegidos por lei. O uso do serviço não transfere quaisquer direitos de propriedade intelectual.</p>

          <h2 className="text-xl font-semibold">12. Alterações nos Termos</h2>
          <p>Podemos atualizar estes Termos periodicamente. Mudanças relevantes serão comunicadas por email ou aviso dentro do aplicativo. O uso continuado após a notificação significa aceite.</p>

          <h2 className="text-xl font-semibold">13. Legislação e foro</h2>
          <p>Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca do domicílio do usuário para resolução de controvérsias, ressalvadas as disposições do Código de Defesa do Consumidor.</p>

          <h2 className="text-xl font-semibold">14. Contato</h2>
          <p>Dúvidas, denúncias ou solicitações: <a href="mailto:contato@myfitlife.app" className="text-primary underline">contato@myfitlife.app</a></p>
        </section>
      </article>
    </main>
  );
}
