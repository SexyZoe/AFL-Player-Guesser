import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GameModeSelector from '../../components/GameModeSelector';
import { GameProvider } from '../../context/GameContext';

const Wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => <GameProvider>{children}</GameProvider>;

test('renders three modes', () => {
  render(<GameModeSelector selectedMode={'solo'} onSelectMode={()=>{}} />, { wrapper: Wrapper });
  expect(screen.getByText(/Solo Mode/)).toBeInTheDocument();
  expect(screen.getByText(/Random Match/)).toBeInTheDocument();
  expect(screen.getByText(/Private Room/)).toBeInTheDocument();
});

test('calls onSelectMode when clicking solo', () => {
  const onSelect = jest.fn();
  render(<GameModeSelector selectedMode={'random'} onSelectMode={onSelect} />, { wrapper: Wrapper });
  fireEvent.click(screen.getByText('Solo Mode'));
  expect(onSelect).toHaveBeenCalled();
});

test('shows BO buttons when random selected', () => {
  render(<GameModeSelector selectedMode={'random'} onSelectMode={()=>{}} />, { wrapper: Wrapper });
  expect(screen.getByText('BO3')).toBeInTheDocument();
  expect(screen.getByText('BO5')).toBeInTheDocument();
  expect(screen.getByText('BO7')).toBeInTheDocument();
});

test('clicking BO buttons does not crash', () => {
  render(<GameModeSelector selectedMode={'random'} onSelectMode={()=>{}} />, { wrapper: Wrapper });
  fireEvent.click(screen.getByText('BO3'));
  fireEvent.click(screen.getByText('BO5'));
  fireEvent.click(screen.getByText('BO7'));
});

test('random card click triggers onSelectMode', () => {
  const onSelect = jest.fn();
  render(<GameModeSelector selectedMode={'solo'} onSelectMode={onSelect} />, { wrapper: Wrapper });
  fireEvent.click(screen.getByText('Random Match'));
  expect(onSelect).toHaveBeenCalled();
});

test('private card click triggers onSelectMode', () => {
  const onSelect = jest.fn();
  render(<GameModeSelector selectedMode={'solo'} onSelectMode={onSelect} />, { wrapper: Wrapper });
  fireEvent.click(screen.getByText('Private Room'));
  expect(onSelect).toHaveBeenCalled();
});

test('title renders correctly', () => {
  render(<GameModeSelector selectedMode={'solo'} onSelectMode={()=>{}} />, { wrapper: Wrapper });
  expect(screen.getByText('Select Game Mode')).toBeInTheDocument();
});

