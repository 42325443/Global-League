import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TablaPosiciones from '../../../src/views/TablaPosiciones';

describe('TablaPosiciones', () => {
  it('renders table', () => {
    render(<TablaPosiciones />);
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
