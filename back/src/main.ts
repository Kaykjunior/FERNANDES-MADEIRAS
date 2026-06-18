import 'dotenv/config'; // Adicione isso na LINHA 1
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://reidasmadeiras.shop',   // Produção
      'http://localhost:3000',        // Desenvolvimento local
      'http://localhost:3001',        // Desenvolvimento local (porta alternativa)
      'http://127.0.0.1:3000',        // IP local
      'http://127.0.0.1:3001',        // IP local
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  // 1. Pipes e Configurações
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // 2. FORÇAR A INICIALIZAÇÃO DOS MÓDULOS (Importante para o TypeORM)
  await app.init();


  const port = process.env.PORT ?? 3000;
  await app.listen(3000);
  logger.log(`🚀 Aplicação rodando em: http://localhost:${port}`);
}

bootstrap();