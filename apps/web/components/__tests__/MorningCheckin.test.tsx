import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../../tests/msw/server';
import { MorningCheckin } from '../morning-checkin';

vi.mock('@/components/body-map', () => ({
  BodyMap: ({ onChange }: { onChange: (v: unknown) => void }) => (
    <div data-testid="body-map" onClick={() => onChange([{ region: 'chest', intensity: 1 }])} />
  ),
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}>{children}</button>
  ),
}));

describe('MorningCheckin', () => {
  it('renderiza os três sliders de check-in', () => {
    render(<MorningCheckin onDone={vi.fn()} />);
    expect(screen.getByText(/Qualidade do sono/i)).toBeInTheDocument();
    expect(screen.getByText(/Energia/i)).toBeInTheDocument();
    expect(screen.getByText(/Humor/i)).toBeInTheDocument();
  });

  it('renderiza botão de salvar', () => {
    render(<MorningCheckin onDone={vi.fn()} />);
    expect(screen.getByRole('button', { name: /salvar check-in/i })).toBeInTheDocument();
  });

  it('mostra seção de dor muscular', () => {
    render(<MorningCheckin onDone={vi.fn()} />);
    expect(screen.getByText(/Dor muscular/i)).toBeInTheDocument();
    expect(screen.getByText(/Nenhuma dor marcada/i)).toBeInTheDocument();
  });

  it('expande mapa corporal ao clicar no botão', () => {
    render(<MorningCheckin onDone={vi.fn()} />);
    fireEvent.click(screen.getByText(/Dor muscular/i).closest('button')!);
    expect(screen.getByTestId('body-map')).toBeInTheDocument();
  });

  it('chama onDone após submit bem-sucedido', async () => {
    server.use(
      http.post('http://localhost:3000/api/checkin', () => HttpResponse.json({ ok: true }))
    );
    const onDone = vi.fn();
    render(<MorningCheckin onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: /salvar check-in/i }));
    await waitFor(() => expect(onDone).toHaveBeenCalled(), { timeout: 3000 });
  });

  it('mostra "Salvando..." durante o submit', async () => {
    server.use(
      http.post('http://localhost:3000/api/checkin', async () => {
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json({ ok: true });
      })
    );
    const onDone = vi.fn();
    render(<MorningCheckin onDone={onDone} />);
    fireEvent.click(screen.getByRole('button', { name: /salvar check-in/i }));
    expect(await screen.findByText('Salvando...')).toBeInTheDocument();
    await waitFor(() => expect(onDone).toHaveBeenCalled());
  });
});
