import { forwardRef, Module } from '@nestjs/common';
import { RomaneiosService } from './romaneios.service';
import { RomaneiosController } from './romaneios.controller';
import { AuthModule } from 'src/modules/auth/auth.module';

@Module({
  imports:[
    forwardRef(() => AuthModule), // Permite que o Controller use os Guards de Auth
  ],
  controllers: [RomaneiosController],
  providers: [RomaneiosService],
})
export class RomaneiosModule {}
