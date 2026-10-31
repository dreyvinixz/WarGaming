import { test, expect } from '@playwright/test';

test('two players start, reinforce, synchronize and reconnect', async ({ browser }) => {
  const a = await browser.newContext(); const b = await browser.newContext();
  const host = await a.newPage(); const guest = await b.newPage();
  await host.goto('/');
  await host.getByPlaceholder('Ex.: Comandante Lia').fill('Host');
  await host.getByRole('button', { name: /CRIAR PARTIDA/ }).click();
  await expect(host.locator('.room-code-display strong')).toBeVisible();
  const code = await host.locator('.room-code-display strong').innerText();
  await guest.goto('/');
  await guest.getByRole('button', {name: 'Entrar em sala'}).click();
  await guest.getByPlaceholder('Ex.: Comandante Lia').fill('Visitante');
  await guest.getByPlaceholder('Ex.: A7C9T2').fill(code);
  await guest.getByRole('button', { name: 'ENTRAR NA SALA' }).click();
  await expect(host.locator('.player-slot', {hasText:'Visitante'})).toBeVisible();
  await host.getByRole('button', { name: /Iniciar partida/ }).click();
  await expect(host.locator('.world-cell')).toHaveCount(36);
  await expect(guest.locator('.world-cell')).toHaveCount(36);
  await host.getByRole('button', { name: 'Aumentar zoom' }).click();
  await expect(host.locator('.world-map-tools')).toContainText('125%');
  await host.getByRole('button', { name: 'Territórios' }).click();
  await expect(host.getByRole('region', { name: 'Lista de territórios' })).toBeVisible();
  await expect(host.locator('.world-territory-list section > button')).toHaveCount(36);
  await host.getByRole('button', { name: 'Fechar lista' }).click();
  const cell = host.locator('.world-cell[aria-label*="Host"]').first();
  const label = await cell.getAttribute('aria-label');
  await cell.click();
  await host.getByRole('button', {name: /ENVIAR REFORÇOS/}).click();
  await expect(cell).not.toHaveAttribute('aria-label', label!);
  await expect(guest.locator('.world-cell').first()).toBeVisible();
  await host.getByRole('button', {name: /PRÓXIMA FASE/}).click();
  await cell.click();
  const target = host.locator('.geo-cell.valid').first();
  await expect(target).toBeVisible();
  await target.click();
  await host.getByRole('button', {name: 'ATACAR', exact: true}).click();
  await expect(host.getByRole('dialog', {name: /conquistado|repelido/i})).toBeVisible();
  await expect(guest.getByRole('dialog', {name: /conquistado|repelido/i})).toBeVisible();
  await host.getByRole('button', {name: 'Continuar partida'}).click();
  await host.reload();
  await expect(host.locator('.world-cell')).toHaveCount(36);
  await host.getByRole('button', { name: 'Sair da partida' }).click();
  await host.getByRole('button', { name: 'Voltar ao início', exact: true }).click();
  await expect(host.getByRole('button', { name: 'Retomar partida' })).toBeVisible();
  await host.getByRole('button', { name: 'Retomar partida' }).click();
  await expect(host.locator('.world-cell')).toHaveCount(36);
  await a.close(); await b.close();
});



test('leaving a waiting room returns to start', async ({ page }) => {
  await page.goto('/');
  await page.getByPlaceholder('Ex.: Comandante Lia').fill('Teste Sala');
  await page.getByRole('button', {name: /CRIAR PARTIDA/}).click();
  await expect(page.getByRole('button', {name: 'Sair da sala'})).toBeVisible();
  await page.getByRole('button', {name: 'Sair da sala'}).click();
  await expect(page.getByRole('heading', {name: /O MUNDO/})).toBeVisible();
});
