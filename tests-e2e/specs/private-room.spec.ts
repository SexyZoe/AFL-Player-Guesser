import { test, expect } from '@playwright/test';

test('create and join private room (smoke)', async ({ browser }) => {
  const host = await browser.newContext();
  const guest = await browser.newContext();
  const p1 = await host.newPage();
  const p2 = await guest.newPage();

  await Promise.all([p1.goto('/'), p2.goto('/')]);
  await p1.getByText('Private Room').click();
  await p1.getByText('Create Room').click();

  const codeEl = p1.locator('text=/^[A-Z0-9]{6}$/');
  await codeEl.waitFor({ state: 'visible' });
  await expect(codeEl).toHaveText(/^[A-Z0-9]{6}$/);
  const code = (await codeEl.textContent())?.trim();
  if (!code) test.fail(true, 'room code not visible');

  await p2.getByText('Private Room').click();
  await p2.getByPlaceholder('Enter room code...').fill(code!);
  await p2.getByRole('button', { name: /^Join Room$/i }).click();

  // waiting screen with Start Game visible for host (may be disabled)
  await expect(p1.getByText('Waiting for Players')).toBeVisible();
});

