// Define a 'forma' (interface) do nosso objeto de usuário
export interface User {
  name: string;
  email: string;
  role: "analista" | "gerente" | "admin";
  team?: string[]; // Array opcional para a equipe do gerente
}

// --- INÍCIO DA ADIÇÃO ---

// Mock de usuários atualizado com sua nova estrutura
const USERS: User[] = [
  // --- Equipe Cassiano ---
  {
    email: 'cassiano@metrocasa.com.br', 
    name: 'Cassiano', 
    role: 'gerente',
    team: ['Gustavo Remorini', 'Allan Prado', 'Vitor Andrade']
  },
  { email: 'gustavo.remorini@metrocasa.com.br', name: 'Gustavo Remorini', role: 'analista' },
  { email: 'allan.prado@metrocasa.com.br', name: 'Allan Prado', role: 'analista' },
  { email: 'vitor.andrade@metrocasa.com.br', name: 'Vitor Andrade', role: 'analista' },

  // --- Equipe Ariane ---
  {
    email: 'ariane.veloso@metrocasa.com.br', 
    name: 'Ariane Veloso', 
    role: 'gerente',
    team: ['Lucas Pasqualini', 'Aline Rodrigues']
  },
  { email: 'lucas.pasqualini@metrocasa.com.br', name: 'Lucas Pasqualini', role: 'analista' },
  { email: 'aline.rodrigues@metrocasa.com', name: 'Aline Rodrigues', role: 'analista' },

  // --- Equipe Fernando ---
  {
    email: 'fernando.seii@metrocasa.com.br', 
    name: 'Fernando Seii', 
    role: 'gerente',
    team: ['Juliane Boscardin', 'Denise Araujo']
  },
  { email: 'juliane.boscardin@metrocasa.com', name: 'Juliane Boscardin', role: 'analista' },
  { email: 'denise.araujo@metrocasa.com', name: 'Denise Araujo', role: 'analista' },

  // --- Equipe Luisa ---
  {
    email: 'luisa.zanhar@metrocasa.com.br', 
    name: 'Luisa Zanhar', 
    role: 'gerente',
    team: ['Arnon Cugola', 'Cecilia Scheydegger']
  },
  { email: 'arnon.cugola@metrocasa.com.br', name: 'Arnon Cugola', role: 'analista' },
  { email: 'cecilia.scheydegger@metrocasa.com.br', name: 'Cecilia Scheydegger', role: 'analista' },
  
  // Adicione um admin se precisar
  { email: 'admin@metrocasa.com.br', name: 'Administrador', role: 'admin', team: [] }
];

// Senha mock única para todos os usuários
const MOCK_PASSWORD = 'Metro@2025';

/**
 * Simula a autenticação de um usuário.
 * @param email 
 * @param password 
 * @returns O objeto User se for bem-sucedido, ou null.
 */
export function authenticateUser(email: string, password: string): User | null {
  const user = USERS.find((u) => u.email === email);

  // Verifica se o usuário existe e se a senha está correta
  if (user && password === MOCK_PASSWORD) {
    return user;
  }
  return null;
}

// --- FIM DA ADIÇÃO ---


// Chave usada para salvar os dados no localStorage do navegador
const USER_STORAGE_KEY = "metrocasa_user";

/**
 * Salva os dados do usuário no localStorage.
 * @param user - O objeto do usuário a ser salvo.
 */
export function setCurrentUser(user: User | null) {
  // Verifica se o código está rodando no navegador antes de usar o localStorage
  if (typeof window === "undefined") {
    return;
  }

  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

/**
 * Recupera os dados do usuário do localStorage.
 * @returns O objeto do usuário ou null se não houver ninguém logado.
 */
export function getCurrentUser(): User | null {
  if (typeof window === "undefined") {
    return null;
  }

  const userStr = localStorage.getItem(USER_STORAGE_KEY);
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    // Se os dados estiverem corrompidos, limpa e retorna null
    console.error("Failed to parse user from localStorage", error);
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
}