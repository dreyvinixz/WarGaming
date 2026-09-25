import { test, expect } from '@playwright/test';

test.describe('Atlas War Full Playthrough', () => {
  test('Two players can create room, join, and play', async ({ browser }) => {
    // We need 2 separate browser contexts to simulate 2 distinct players
    const p1Context = await browser.newContext();
    const p2Context = await browser.newContext();

    const p1Page = await p1Context.newPage();
    const p2Page = await p2Context.newPage();

    p1Page.on('console', msg => console.log('P1 Console:', msg.type(), msg.text()));
    p1Page.on('pageerror', err => console.log('P1 PageError:', err.message));
    p2Page.on('console', msg => console.log('P2 Console:', msg.type(), msg.text()));
    p2Page.on('pageerror', err => console.log('P2 PageError:', err.message));

    // Player 1 - Create Room
    await p1Page.goto('/');
    await p1Page.fill('input[placeholder="Ex.: Comandante Lia"]', 'JogadorHost');
    await p1Page.click('button:has-text("Criar nova partida")');

    // Wait for room to be created and check for Sector header
    await expect(p1Page.locator('h1', { hasText: 'Sala' })).toBeVisible();
    
    // Extract Room Code
    const sectorText = await p1Page.locator('h1').innerText();
    const roomCode = sectorText.replace('Sala ', '').trim();
    expect(roomCode).toHaveLength(6);

    // Player 2 - Join Room
    await p2Page.goto('/');
    await p2Page.fill('input[placeholder="Ex.: Comandante Lia"]', 'JogadorVisitante');
    await p2Page.fill('input[placeholder="Ex.: A7C9T2"]', roomCode);
    await p2Page.click('button:has-text("Entrar na sala")');

    // Wait for Player 2 to join
    await expect(p2Page.locator('h1', { hasText: `Sala ${roomCode}` })).toBeVisible();

    // Allow time for WebSocket connection to establish for Player 2
    await p1Page.waitForTimeout(1000);

    // Player 1 - Start Match
    await p1Page.click('button:has-text("Iniciar partida")');

    // Both should see the round and the Atlas map
    await expect(p1Page.locator('.section-kicker', { hasText: 'RODADA 1' })).toBeVisible();
    await expect(p2Page.locator('.section-kicker', { hasText: 'RODADA 1' })).toBeVisible();

    // Check that SVG map rendered by looking for nodes
    await expect(p1Page.locator('.atlas-troop-marker')).toHaveCount(13, { timeout: 10000 });

    // Turn 1 is Player 1 (deterministic alphabetical order: GuestCommander vs HostCommander)
    // GuestCommander is 'G', HostCommander is 'H'. GuestCommander is first.
    // Let's explicitly check who has the YOUR TURN text
    let p1Turn = false;
    try {
      await p1Page.locator('text=SEU TURNO').first().waitFor({ timeout: 2000 });
      p1Turn = true;
    } catch {
      p1Turn = false;
    }
    
    const currentPlayerPage = p1Turn ? p1Page : p2Page;
    const opponentPage = p1Turn ? p2Page : p1Page;

    // Wait for it to be visible on the current player page
    await expect(currentPlayerPage.locator('text=SEU TURNO').first()).toBeVisible();

    // Check reinforcement phase
    await expect(currentPlayerPage.locator('text=Fortifique seus territórios')).toBeVisible();
    
    // In default layout, N1 is often owned by someone.
    // If Guest (first alphabetically) is playing, they own N1 and N3. Wait, alphabetical order: GuestCommander, HostCommander.
    // players[0] gets N1, N3. players[1] gets N2, N4.
    // So Guest gets N1. Host gets N2.
    // Let's just click N1 if Guest, N2 if Host.
    const myNode = p1Turn ? 'N1' : 'N2';

    await currentPlayerPage.locator(`g.atlas-troop-marker[data-node-id="${myNode}"]`).click({ force: true });
    
    // Expect ActionModal to appear
    await expect(currentPlayerPage.locator('.modal-content')).toBeVisible();
    await expect(currentPlayerPage.locator('text=Enviar reforços')).toBeVisible();
    
    // Deploy 1 fleet
    const reinforcementInput = currentPlayerPage.locator('input[type="number"]');
    const reinforcementMax = await reinforcementInput.getAttribute('max');
    await reinforcementInput.fill(reinforcementMax || '1');
    await currentPlayerPage.click('button:has-text("Confirmar ação")');

    // Modal closes
    await expect(currentPlayerPage.locator('.modal-content')).not.toBeVisible();

    // Advance Phase
    await currentPlayerPage.click('button:has-text("Avançar fase")');
    await expect(currentPlayerPage.locator('text=Expanda seu domínio')).toBeVisible();
    await expect(opponentPage.locator('text=Expanda seu domínio')).toBeVisible();

    // Attack
    // N1 is adjacent to N2.
    const targetNode = p1Turn ? 'N2' : 'N1';
    
    await currentPlayerPage.locator(`g.atlas-troop-marker[data-node-id="${myNode}"]`).click({ force: true }); // Source
    await currentPlayerPage.locator(`g.atlas-troop-marker[data-node-id="${targetNode}"]`).click({ force: true }); // Target

    // Expect ActionModal for Attack
    await expect(currentPlayerPage.locator('.modal-content')).toBeVisible();
    await expect(currentPlayerPage.locator('text=Iniciar ataque')).toBeVisible();
    
    // Execute Attack
    await currentPlayerPage.click('button:has-text("Confirmar ação")');
    await expect(currentPlayerPage.locator('.modal-content')).not.toBeVisible();

    // Advance Phase again
    await currentPlayerPage.click('button:has-text("Avançar fase")');
    await expect(currentPlayerPage.locator('text=Reposicione suas tropas')).toBeVisible();

    // End Turn
    await currentPlayerPage.click('button:has-text("Encerrar turno")');
    
    // Check that turn passed to the other player
    await expect(opponentPage.locator('text=SEU TURNO').first()).toBeVisible();
    
    await p1Context.close();
    await p2Context.close();
  });
});
