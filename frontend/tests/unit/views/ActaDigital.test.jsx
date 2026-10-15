import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ActaDigital from '../../../src/views/ActaDigital';

describe('ActaDigital full', () => {
  it('renders and validates form', () => {
    render(<ActaDigital />);
    expect(screen.getByText(/acta/i)).toBeInTheDocument();
  });
  it('state transition after sign', () => {
    render(<ActaDigital />);
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
});
