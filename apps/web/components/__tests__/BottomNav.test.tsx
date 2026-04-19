import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BottomNav } from '../bottom-nav';

vi.mock('next/navigation', () => ({
  usePathname: () => '/app',
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('BottomNav', () => {
  it('renderiza 5 itens de navegação', () => {
    render(<BottomNav />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
  });

  it('renderiza link pra Início', () => {
    render(<BottomNav />);
    expect(screen.getByText('Início')).toBeInTheDocument();
  });

  it('renderiza link pra Treino', () => {
    render(<BottomNav />);
    expect(screen.getByText('Treino')).toBeInTheDocument();
  });

  it('renderiza link pra Coach', () => {
    render(<BottomNav />);
    expect(screen.getByText('Coach')).toBeInTheDocument();
  });

  it('renderiza link pra Perfil', () => {
    render(<BottomNav />);
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });

  it('marca /app como ativo quando pathname é /app', () => {
    render(<BottomNav />);
    const inicioLink = screen.getByText('Início').closest('a');
    expect(inicioLink?.className).toContain('text-primary');
  });
});
