import React from 'react';
import { render, screen } from '@testing-library/react';
import RoomSidebar from '../../components/RoomSidebar';

test('renders placeholders when empty', () => {
  render(<RoomSidebar players={[]} playersStatus={null} maxSlots={2} />);
  expect(screen.getAllByText('Waiting...').length).toBe(2);
});

test('renders player nickname', () => {
  render(
    <RoomSidebar
      players={[{ socketId: 'a', displayName: 'Alice' }]}
      playersStatus={{}}
      maxSlots={2}
      currentSocketId={'a'}
    />
  );
  expect(screen.getByText(/Alice/)).toBeInTheDocument();
});

test('shows guesses badge', () => {
  render(
    <RoomSidebar
      players={[{ socketId: 'a', displayName: 'Alice' }]}
      playersStatus={{ a: { socketId: 'a', guesses: 2, isFinished: false, isWinner: false } }}
      maxSlots={1}
    />
  );
  expect(screen.getByText('2')).toBeInTheDocument();
});

