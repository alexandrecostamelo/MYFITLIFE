import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface Props {
  preview: string;
  children: React.ReactNode;
}

export const BRAND = {
  color: '#00D9A3',
  bg: '#0A0A0A',
  surface: '#141414',
  text: '#FAFAFA',
  muted: '#A0A0A0',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://myfitlife.app',
};

export function EmailLayout({ preview, children }: Props) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body
          style={{
            backgroundColor: BRAND.bg,
            fontFamily: 'Inter, system-ui, sans-serif',
            margin: 0,
            padding: 0,
          }}
        >
          <Container
            style={{
              maxWidth: '500px',
              margin: '0 auto',
              padding: '24px 16px',
            }}
          >
            <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
              <Text
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: BRAND.color,
                  margin: 0,
                }}
              >
                MyFitLife
              </Text>
            </Section>

            <Section
              style={{
                backgroundColor: BRAND.surface,
                borderRadius: '16px',
                padding: '32px 24px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {children}
            </Section>

            <Hr
              style={{
                borderColor: 'rgba(255,255,255,0.08)',
                margin: '32px 0 16px',
              }}
            />

            <Section style={{ textAlign: 'center' }}>
              <Text
                style={{
                  fontSize: '12px',
                  color: BRAND.muted,
                  margin: '0 0 8px',
                }}
              >
                <Link
                  href={`${BRAND.url}/app/dashboard`}
                  style={{ color: BRAND.muted }}
                >
                  Abrir App
                </Link>
                {' \u00b7 '}
                <Link
                  href={`${BRAND.url}/app/settings`}
                  style={{ color: BRAND.muted }}
                >
                  Configura\u00e7\u00f5es
                </Link>
                {' \u00b7 '}
                <Link
                  href={`${BRAND.url}/app/settings/notifications`}
                  style={{ color: BRAND.muted }}
                >
                  Gerenciar emails
                </Link>
              </Text>
              <Text style={{ fontSize: '11px', color: '#666', margin: 0 }}>
                MyFitLife Tecnologia LTDA \u00b7 Presidente Prudente, SP
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export function EmailHeading({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Text
      style={{
        fontSize: '22px',
        fontWeight: 700,
        color: '#FAFAFA',
        margin: '0 0 8px',
        lineHeight: '1.3',
      }}
    >
      {children}
    </Text>
  );
}

export function EmailText({
  children,
  muted,
}: {
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <Text
      style={{
        fontSize: '14px',
        color: muted ? '#A0A0A0' : '#FAFAFA',
        margin: '0 0 16px',
        lineHeight: '1.6',
      }}
    >
      {children}
    </Text>
  );
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Link
        href={href}
        style={{
          backgroundColor: '#00D9A3',
          color: '#0A0A0A',
          padding: '14px 32px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

export function EmailMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Section style={{ textAlign: 'center', padding: '8px 0' }}>
      <Text
        style={{
          fontSize: '32px',
          fontWeight: 300,
          color: '#FAFAFA',
          margin: '0',
          fontFamily: 'JetBrains Mono, monospace',
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: '#A0A0A0',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          margin: '4px 0 0',
        }}
      >
        {label}
      </Text>
    </Section>
  );
}

export function EmailCard({ children }: { children: React.ReactNode }) {
  return (
    <Section
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        margin: '16px 0',
      }}
    >
      {children}
    </Section>
  );
}
