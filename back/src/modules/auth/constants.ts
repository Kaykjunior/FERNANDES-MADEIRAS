export const JwtConfig = {
  secret: process.env.JWT_SECRET || 'CHAVE_SUPER_SECRETA_MADEIREIRA_DEV',
  expiresIn: '12h' as any, // O 'as any' resolve o conflito de tipagem do TypeScript
};