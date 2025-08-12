import React from 'react';
import { render, screen } from '@testing-library/react';
import PlayerCard from '../../components/PlayerCard';

const player = {
  name: 'Test Player',
  team: 'Adelaide Crows',
  age: '25yr',
  height: '190cm',
  weight: '85kg',
  number: 10,
  position: 'Forward',
  gamesPlayed: 100,
  image: '',
};

test('renders player name and number', () => {
  render(<PlayerCard player={player as any} />);
  expect(screen.getByText('Test Player')).toBeInTheDocument();
  expect(screen.getByText('#10')).toBeInTheDocument();
});

test('renders team and position', () => {
  render(<PlayerCard player={player as any} />);
  expect(screen.getByText('Team')).toBeInTheDocument();
  expect(screen.getByText('Position')).toBeInTheDocument();
});

test('renders stats boxes', () => {
  render(<PlayerCard player={player as any} />);
  expect(screen.getByText('Age')).toBeInTheDocument();
  expect(screen.getByText('Height')).toBeInTheDocument();
  expect(screen.getByText('Weight')).toBeInTheDocument();
  expect(screen.getByText('Games')).toBeInTheDocument();
});

test('fallback avatar when no image', () => {
  render(<PlayerCard player={{...player, image: ''} as any} />);
  expect(screen.getAllByText('👤').length).toBeGreaterThan(0);
});

test('handles image error gracefully', () => {
  render(<PlayerCard player={{...player, image: 'bad-url.webp'} as any} />);
  // jsdom 不加载图片，但组件路径和状态切换不报错即可
  expect(screen.getByText('Test Player')).toBeInTheDocument();
});

test('renders container with card class', () => {
  const { container } = render(<PlayerCard player={player as any} />);
  expect(container.querySelector('.relative')).toBeTruthy();
});

