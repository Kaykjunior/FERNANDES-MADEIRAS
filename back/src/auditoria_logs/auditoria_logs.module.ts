import { Module } from '@nestjs/common';
import { AuditoriaLogsService } from './auditoria_logs.service';
import { AuditoriaLogsController } from './auditoria_logs.controller';

@Module({
  controllers: [AuditoriaLogsController],
  providers: [AuditoriaLogsService],
})
export class AuditoriaLogsModule {}
