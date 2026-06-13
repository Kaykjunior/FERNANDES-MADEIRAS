import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AuditoriaLogsService } from './auditoria_logs.service';
import { CreateAuditoriaLogDto } from './dto/create-auditoria_log.dto';
import { UpdateAuditoriaLogDto } from './dto/update-auditoria_log.dto';

@Controller('auditoria-logs')
export class AuditoriaLogsController {
  constructor(private readonly auditoriaLogsService: AuditoriaLogsService) {}

  @Post()
  create(@Body() createAuditoriaLogDto: CreateAuditoriaLogDto) {
    return this.auditoriaLogsService.create(createAuditoriaLogDto);
  }

  @Get()
  findAll() {
    return this.auditoriaLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.auditoriaLogsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuditoriaLogDto: UpdateAuditoriaLogDto) {
    return this.auditoriaLogsService.update(+id, updateAuditoriaLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.auditoriaLogsService.remove(+id);
  }
}
