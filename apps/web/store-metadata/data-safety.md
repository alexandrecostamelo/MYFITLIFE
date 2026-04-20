# Google Play Data Safety — MyFitLife

## Dados coletados

### Informações pessoais
- **Email**: Coletado para autenticação. Compartilhado com Supabase Auth.
- **Nome**: Coletado para personalização. Não compartilhado.

### Saúde e fitness
- **Dados de atividade física**: Treinos, exercícios, séries, repetições. Não compartilhado.
- **Dados de saúde**: Peso, sono, frequência cardíaca, HRV (via Health Connect). Não compartilhado com terceiros.
- **Informações nutricionais**: Refeições registradas, calorias. Não compartilhado.

### Fotos e vídeos
- **Fotos**: Capturadas para reconhecimento de alimentos/aparelhos e progresso. Processadas via API Claude (Anthropic). Não armazenadas permanentemente pela Anthropic.

### Localização
- **Localização aproximada**: Usada para check-in em academias e GPS de corrida. Não compartilhada com terceiros.
- **Localização precisa**: Usada durante GPS tracking de corrida. Armazenada localmente.

### Informações financeiras
- **Dados de pagamento**: Processados por Stripe/PagarMe. MyFitLife não armazena números de cartão.

### Identificadores
- **ID do dispositivo**: Push notifications via Firebase Cloud Messaging.

## Dados NÃO coletados
- Contatos, SMS, calendário, arquivos, navegação web, interações com apps

## Práticas de segurança
- Dados encriptados em trânsito (HTTPS/TLS)
- Dados podem ser excluídos pelo usuário (LGPD)
- Dados podem ser exportados pelo usuário

## Dados compartilhados com terceiros
- **Supabase**: Banco de dados (hospedagem)
- **Anthropic Claude**: Processamento de IA (fotos de alimentos, coach)
- **Stripe/PagarMe**: Pagamentos
- **Resend**: Email transacional
- **Sentry**: Relatório de erros (sem dados pessoais)
- **PostHog**: Analytics (sem dados de saúde)
