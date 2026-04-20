import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailCard,
} from './components/layout';

interface Props {
  name: string;
  nfseNumber: string;
  amount: string;
  description: string;
  pdfUrl?: string;
}

export function NfseIssuedEmail({
  name,
  nfseNumber,
  amount,
  description,
  pdfUrl,
}: Props) {
  const firstName = name?.split(' ')[0] || 'Cliente';
  return (
    <EmailLayout preview={`Nota fiscal ${nfseNumber} emitida`}>
      <EmailHeading>Nota fiscal emitida</EmailHeading>
      <EmailText>
        Oi {firstName}, sua NFSe foi gerada.
      </EmailText>
      <EmailCard>
        <EmailText muted>
          NFSe: {nfseNumber}
          {'\n'}
          Servi\u00e7o: {description}
          {'\n'}
          Valor: R$ {amount}
        </EmailText>
      </EmailCard>
      {pdfUrl && (
        <EmailButton href={pdfUrl}>Baixar PDF</EmailButton>
      )}
      <EmailText muted>MyFitLife Tecnologia LTDA</EmailText>
    </EmailLayout>
  );
}

export default NfseIssuedEmail;
