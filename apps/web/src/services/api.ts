const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000/api/v1' : '/api/v1');
async function request(input: RequestInfo | URL, init?: RequestInit) {
  try { return await fetch(input, init); }
  catch { throw new Error('Não foi possível conectar ao servidor do jogo. Verifique sua conexão e tente novamente.'); }
}




export async function createRoom(playerName: string, maxPlayers: number = 2) {

  const res = await request(`${API_URL}/rooms`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ player_name: playerName, max_players: maxPlayers })

  });

  if (!res.ok) throw new Error(await res.text());

  return res.json();

}



export async function joinRoom(roomCode: string, playerName: string) {

  const res = await request(`${API_URL}/rooms/${roomCode}/join`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ player_name: playerName })

  });

  if (!res.ok) throw new Error(await res.text());

  return res.json();

}



export async function startMatch(roomCode: string, token: string) {

  const res = await request(`${API_URL}/rooms/${roomCode}/start`, {

    method: 'POST',

    headers: { 

      'Content-Type': 'application/json',

      'Authorization': `Bearer ${token}`

    }

  });

  if (!res.ok) throw new Error(await res.text());

  return res.json();

}



export async function getRoom(roomCode: string) {

  const res = await request(`${API_URL}/rooms/${roomCode}`);

  if (!res.ok) throw new Error('Sala indisponível');

  return res.json();

}


export async function leaveWaitingRoom(roomCode: string, token: string) {
  const res = await request(`${API_URL}/rooms/${roomCode}/leave`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(res.status === 409 ? 'A partida já começou. Recarregue para acessá-la.' : 'Não foi possível sair da sala. Verifique sua conexão.');
}
