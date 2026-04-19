import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillNode } from '../skills/SkillNode';
import type { SkillNodeData } from '../skills/SkillNode';

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Top: 'top', Bottom: 'bottom' },
}));

const baseData: SkillNodeData = {
  name: 'Flexão padrão',
  tier: 2,
  status: 'available',
  progress: 0,
  category: 'calistenia',
  onClick: vi.fn(),
};

describe('SkillNode', () => {
  it('renderiza o nome da skill', () => {
    render(<SkillNode data={baseData} />);
    expect(screen.getByText('Flexão padrão')).toBeInTheDocument();
  });

  it('renderiza o tier correto', () => {
    render(<SkillNode data={baseData} />);
    expect(screen.getByText(/Tier 2/i)).toBeInTheDocument();
  });

  it('chama onClick ao clicar no botão', () => {
    const onClick = vi.fn();
    render(<SkillNode data={{ ...baseData, onClick }} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('mostra barra de progresso quando status é in_progress', () => {
    const { container } = render(
      <SkillNode data={{ ...baseData, status: 'in_progress', progress: 60 }} />
    );
    const bar = container.querySelector('[style*="60%"]');
    expect(bar).toBeTruthy();
  });

  it('aplica opacidade reduzida quando locked', () => {
    const { container } = render(<SkillNode data={{ ...baseData, status: 'locked' }} />);
    const button = container.querySelector('button');
    expect(button?.className).toContain('opacity-60');
  });

  it('tem aria-label com nome, tier e status', () => {
    render(<SkillNode data={baseData} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('Flexão padrão'));
    expect(button).toHaveAttribute('aria-label', expect.stringContaining('2'));
  });

  it('não mostra barra de progresso quando status é available', () => {
    const { container } = render(<SkillNode data={{ ...baseData, status: 'available', progress: 50 }} />);
    const progressBars = container.querySelectorAll('[class*="bg-blue-500"]');
    expect(progressBars).toHaveLength(0);
  });
});
