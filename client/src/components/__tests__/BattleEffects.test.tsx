import React from 'react';
import { render } from '@testing-library/react';
import BattleEffects from '../../components/BattleEffects';

test('renders without crash', () => {
  const { container } = render(<BattleEffects />);
  expect(container).toBeTruthy();
});

