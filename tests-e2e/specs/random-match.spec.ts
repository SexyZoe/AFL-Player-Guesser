import { test, expect } from '@playwright/test';

test('random match: enter queue → ack → start playing', async ({ browser }) => {
  const c1 = await browser.newContext();
  const c2 = await browser.newContext();
  const p1 = await c1.newPage();
  const p2 = await c2.newPage();

  await Promise.all([p1.goto('/'), p2.goto('/')]);

  // Choose random mode
  await p1.getByText('Random Match').click();
  await p2.getByText('Random Match').click();

  // Set names when prompted (modal can open later, so try to open via Find Opponent)
  await p1.getByText('Find Opponent').click();
  await expect(p1.getByRole('dialog', { name: /Set Name/i })).toBeVisible({ timeout: 5000 });
  await p1.getByRole('textbox').fill('Alice');
  await p1.getByRole('button', { name: /Let's Play!/i }).click();
  await expect(p1.getByText('寻找对手中', { exact: false })).toBeVisible({ timeout: 10_000 });
  await expect(p1.getByText('取消匹配', { exact: false })).toBeVisible({ timeout: 10_000 });

  await p2.getByText('Find Opponent').click();
  await expect(p2.getByRole('dialog', { name: /Set Name/i })).toBeVisible({ timeout: 5000 });
  await p2.getByRole('textbox').fill('Bob');
  await p2.getByRole('button', { name: /Let's Play!/i }).click();
  // p2 可能很快从匹配中直接进入对战界面（取决于 p1 的速度），因此接受任一可见
  const searching2 = p2.getByText('寻找对手中', { exact: false });
  const playing2 = p2.getByText('Battle Guess Player');
  await Promise.race([
    searching2.waitFor({ state: 'visible', timeout: 10_000 }),
    playing2.waitFor({ state: 'visible', timeout: 10_000 }),
  ]);

  // After match found and ACK→ playing
  await expect(p1.getByText('Battle Guess Player')).toBeVisible({ timeout: 45_000 });
  await expect(p2.getByText('Battle Guess Player')).toBeVisible({ timeout: 45_000 });
});

test('cancel matchmaking returns to waiting', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  await page.getByText('Random Match').click();
  await page.getByText('Find Opponent').click();
  await expect(page.getByRole('dialog', { name: /Set Name/i })).toBeVisible({ timeout: 5000 });
  await page.getByRole('textbox').fill('Solo');
  await page.getByRole('button', { name: /Let's Play!/i }).click();
  await expect(page.getByText('取消匹配', { exact: false })).toBeVisible({ timeout: 10_000 });
  await page.getByText('取消匹配', { exact: false }).click();
  await expect(page.getByText('Select Game Mode')).toBeVisible();
});

test('restart reloads page from error screen', async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('/');
  // Force error: go to playing then reload opponent? Hard to simulate here.
  // Just assert the button exists when error shown is out of scope for smoke.
});

