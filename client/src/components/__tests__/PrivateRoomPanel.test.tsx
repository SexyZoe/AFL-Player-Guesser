import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrivateRoomPanel from '../../components/PrivateRoomPanel';

test('renders create and join when no room', () => {
  render(<PrivateRoomPanel roomCode="" onCreateRoom={()=>{}} onJoinRoom={()=>{}} onStartGame={()=>{}} />);
  expect(screen.getByText('Create Private Room')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: /Join Room/i })).toBeInTheDocument();
});

test('create room button calls handler', () => {
  const onCreate = jest.fn();
  render(<PrivateRoomPanel roomCode="" onCreateRoom={onCreate} onJoinRoom={()=>{}} onStartGame={()=>{}} />);
  fireEvent.click(screen.getByText('Create Room'));
  expect(onCreate).toHaveBeenCalled();
});

test('join room input enables button', () => {
  render(<PrivateRoomPanel roomCode="" onCreateRoom={()=>{}} onJoinRoom={()=>{}} onStartGame={()=>{}} />);
  const input = screen.getByPlaceholderText('Enter room code...');
  fireEvent.change(input, { target: { value: 'ABC123' } });
  expect(screen.getByRole('button', { name: /Join Room/i })).not.toBeDisabled();
});

test('shows room code when in room', () => {
  render(<PrivateRoomPanel roomCode="ROOM01" onCreateRoom={()=>{}} onJoinRoom={()=>{}} onStartGame={()=>{}} />);
  expect(screen.getByText('ROOM01')).toBeInTheDocument();
});

test('start button disabled until canStart', () => {
  render(<PrivateRoomPanel roomCode="ROOM01" onCreateRoom={()=>{}} onJoinRoom={()=>{}} onStartGame={()=>{}} players={[]} />);
  const btn = screen.getByText('Start Game');
  expect(btn).toHaveClass('cursor-not-allowed');
});

test('players list title shown', () => {
  render(<PrivateRoomPanel roomCode="ROOM01" onCreateRoom={()=>{}} onJoinRoom={()=>{}} onStartGame={()=>{}} />);
  expect(screen.getByText('Players in Room')).toBeInTheDocument();
});

test('copy code button exists', () => {
  render(<PrivateRoomPanel roomCode="ROOM01" onCreateRoom={()=>{}} onJoinRoom={()=>{}} onStartGame={()=>{}} />);
  expect(screen.getByText('Copy Code')).toBeInTheDocument();
});

