// Função para pegar apenas o Token (útil para Headers de API)
export const getToken = (): string | null => {
    if (typeof window === "undefined") return null; // Proteção para Next.js (SSR)
    return localStorage.getItem("token");
};

// Função para pegar o objeto do usuário completo
export const getUser = () => {
    if (typeof window === "undefined") return null;
    const user = localStorage.getItem("user");
    try {
        return user ? JSON.parse(user) : null;
    } catch (error) {
        console.error("Erro ao converter usuário do localStorage", error);
        return null;
    }
};

// lib/auth.ts

export const getAuthHeader = (): Record<string, string> => {
  if (typeof window === "undefined") return {};

  const token = localStorage.getItem("token");
  
  // Se não houver token, retorna objeto vazio, mas tipado como Record
  if (!token) return {};

  return {
    "Authorization": `Bearer ${token}`
  };
};

// Função para pegar especificamente o ID (vendedorId)
export const getUserId = (): string | null => {
    const user = getUser();
    return user ? user.id : null;
};

// Função para pegar o Nome (para exibir no Header)
export const getUserNome = (): string => {
    const user = getUser();
    return user ? user.nome : "nome";
};

// Função para pegar o Nome (para exibir no Header)
export const getUserCargp = (): string => {
    const user = getUser();
    return user ? user.cargo : "cargo";
};


export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
};