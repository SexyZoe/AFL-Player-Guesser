import React from 'react';
import { render, screen } from '@testing-library/react';
import BattleStatus from '../../components/BattleStatus';

const baseProps = {
  currentPlayer: { socketId: 'me', guesses: 0, isFinished: false, isWinner: false },
  opponent: { socketId: 'opp', guesses: 0, isFinished: false, isWinner: false },
  battleResult: null as 'win' | 'lose' | null,
};

test('renders without crashing when players present', () => {
  render(<BattleStatus {...baseProps} />);
  expect(screen.getAllByText(/Guesses:/).length).toBe(2);
});

test('shows current and opponent guesses', () => {
  render(<BattleStatus {...baseProps} currentPlayer={{...baseProps.currentPlayer, guesses: 2}} opponent={{...baseProps.opponent, guesses: 3}} />);
  const guesses = screen.getAllByText(/Guesses:/);
  expect(guesses[0].parentElement).toHaveTextContent('2');
  expect(guesses[1].parentElement).toHaveTextContent('3');
});

test('hides when a player is missing', () => {
  const { container } = render(<BattleStatus currentPlayer={null as any} opponent={baseProps.opponent} battleResult={null} />);
  expect(container.firstChild).toBeNull();
});

test('shows win banner', () => {
  render(<BattleStatus {...baseProps} battleResult="win" />);
  expect(screen.getByText(/Victory!/)).toBeInTheDocument();
});

test('shows defeat banner', () => {
  render(<BattleStatus {...baseProps} battleResult="lose" />);
  expect(screen.getByText(/Defeat!/)).toBeInTheDocument();
});

test('shows finished/playing states', () => {
  render(<BattleStatus {...baseProps} currentPlayer={{...baseProps.currentPlayer, isFinished: true}} opponent={{...baseProps.opponent, isFinished: false}} />);
  expect(screen.getAllByText(/Finished/).length).toBe(1);
  expect(screen.getAllByText(/Playing/).length).toBe(1);
});

test('renders VS divider', () => {
  render(<BattleStatus {...baseProps} />);
  expect(screen.getByText('VS')).toBeInTheDocument();
});

