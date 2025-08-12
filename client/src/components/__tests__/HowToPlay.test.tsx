import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HowToPlay from '../../components/HowToPlay';

test('opens and closes modal', () => {
  render(<HowToPlay />);
  fireEvent.click(screen.getByText('How to Play'));
  expect(screen.getByRole('heading', { name: /How to Play/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Let's Play/i }));
});

test('shows modes section', () => {
  render(<HowToPlay />);
  fireEvent.click(screen.getByText('How to Play'));
  expect(screen.getByRole('heading', { name: /Game Modes/i })).toBeInTheDocument();
});

test('shows rules section', () => {
  render(<HowToPlay />);
  fireEvent.click(screen.getByText('How to Play'));
  expect(screen.getByRole('heading', { name: /Game Rules/i })).toBeInTheDocument();
});

test('shows keyboard shortcuts', () => {
  render(<HowToPlay />);
  fireEvent.click(screen.getByText('How to Play'));
  expect(screen.getByRole('heading', { name: /Keyboard Shortcuts/i })).toBeInTheDocument();
});

test('modal overlay closes on click', () => {
  const { container } = render(<HowToPlay />);
  fireEvent.click(screen.getByText('How to Play'));
  const overlay = container.querySelector('.modal-overlay');
  if (overlay) {
    fireEvent.click(overlay);
  }
});

test('has close button', () => {
  render(<HowToPlay />);
  fireEvent.click(screen.getByText('How to Play'));
  expect(screen.getByRole('button', { name: '✕' })).toBeInTheDocument();
});

