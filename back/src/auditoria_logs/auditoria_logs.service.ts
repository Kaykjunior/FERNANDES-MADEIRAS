import { Injectable } from '@nestjs/common';
import { CreateAuditoriaLogDto } from './dto/create-auditoria_log.dto';
import { UpdateAuditoriaLogDto } from './dto/update-auditoria_log.dto';

@Injectable()
export class AuditoriaLogsService {
  create(createAuditoriaLogDto: CreateAuditoriaLogDto) {
    return 'This action adds a new auditoriaLog';
  }

  findAll() {
    return `This action returns all auditoriaLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auditoriaLog`;
  }

  update(id: number, updateAuditoriaLogDto: UpdateAuditoriaLogDto) {
    return `This action updates a #${id} auditoriaLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} auditoriaLog`;
  }
}
