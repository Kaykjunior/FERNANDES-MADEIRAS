import { forwardRef, Module } from '@nestjs/common';
import { ConfiguracoesFiscaisCfopService } from './configuracoes_fiscais_cfop.service';
import { ConfiguracoesFiscaisCfopController } from './configuracoes_fiscais_cfop.controller';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports:[forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
    ],
  controllers: [ConfiguracoesFiscaisCfopController],
  providers: [ConfiguracoesFiscaisCfopService],
})
export class ConfiguracoesFiscaisCfopModule {}
