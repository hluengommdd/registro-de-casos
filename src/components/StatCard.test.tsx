import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import StatCard from './StatCard';

// Wrapper para provide context
interface TestWrapperProps {
  children: ReactNode;
}

function TestWrapper({ children }: TestWrapperProps) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

describe('StatCard', () => {
  it('renders title and value correctly', () => {
    render(
      <TestWrapper>
        <StatCard
          title="Casos Activos"
          value={25}
          subtitle="Casos en seguimiento"
          icon={<span>Icon</span>}
          color="bg-blue-500"
        />
      </TestWrapper>,
    );

    expect(screen.getByText('Casos Activos')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Casos en seguimiento')).toBeInTheDocument();
  });

  it('renders with different colors', () => {
    const { rerender } = render(
      <TestWrapper>
        <StatCard title="Test" value={10} color="bg-red-500" />
      </TestWrapper>,
    );

    expect(screen.getByText('Test')).toBeInTheDocument();

    rerender(
      <TestWrapper>
        <StatCard title="Test 2" value={20} color="bg-green-500" />
      </TestWrapper>,
    );

    expect(screen.getByText('Test 2')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();

    render(
      <TestWrapper>
        <StatCard title="Clickable" value={5} onClick={handleClick} />
      </TestWrapper>,
    );

    const card = screen.getByText('Clickable').closest('div');
    card?.click();

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
