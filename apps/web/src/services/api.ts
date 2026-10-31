const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
async function request(input: RequestInfo | URL, init?: RequestInit) {
  try { return await fetch(input, init); }
  catch { throw new Error('Não foi possível conectar ao servidor. Verifique se a API está em execução na porta 8000.'); }
}




export async function createRoom(playerName: string, color: string, maxPlayers: number = 6) {

  const res = await request(`${API_URL}/rooms`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ player_name: playerName, color, max_players: maxPlayers })

  });

  if (!res.ok) throw new Error(await res.text());

  return res.json();

}



export async function joinRoom(roomCode: string, playerName: string, color: string) {

  const res = await request(`${API_URL}/rooms/${roomCode}/join`, {

    method: 'POST',

    headers: { 'Content-Type': 'application/json' },

    body: JSON.stringify({ player_name: playerName, color })

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
