const baseURL = 'https://tasy-metadata-app.herokuapp.com';
const headers = {
  'X-Origin': 'extension',
  'Content-Type': 'application/json'
};

async function getOrCreateUser(userId) {
  if (userId) {
    try {
      const response = await fetch(`${baseURL}/user/${userId}`);
      if (response.ok) {
        const user = await response.json();
        if (user) return user;
      }
    } catch (error) {
      // Usuário não encontrado ou erro de rede, prossegue para criar um novo.
      console.error("Erro ao buscar usuário:", error);
    }
  }

  // Se não houver userId ou a busca falhar, cria um novo usuário.
  const response = await fetch(`${baseURL}/user`, { method: 'POST' });
  if (!response.ok) {
    throw new Error('Não foi possível criar o usuário.');
  }
  return response.json();
}

function createEvent(userId, event) {
  return fetch(`${baseURL}/user/${userId}/event/${event}`, { method: 'POST' })
    .catch(err => console.error("Falha ao criar evento:", err));
}

function createOptions(userId, options) {
  return fetch(`${baseURL}/user/${userId}/options`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(options)
  }).catch(err => console.error("Falha ao criar opções:", err));
}

export { getOrCreateUser, createEvent, createOptions };
