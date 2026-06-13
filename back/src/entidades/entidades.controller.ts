import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards
} from '@nestjs/common';
import { EntidadesService } from './entidades.service';
import { CreateEntidadeDto } from './dto/create-entidade.dto';
import { UpdateEntidadeDto } from './dto/update-entidade.dto';
import { FilterEntidadeDto } from './dto/filter-entidade.dto';
import { TipoEntidade } from './entities/entidade.entity';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('entidades')
export class EntidadesController {
  constructor(private readonly entidadesService: EntidadesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createEntidadeDto: CreateEntidadeDto) {
    return await this.entidadesService.create(createEntidadeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() filterDto: FilterEntidadeDto) {
    return await this.entidadesService.findAll(filterDto);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  async findAllWithDeleted() {
    return await this.entidadesService.findAllWithDeleted();
  }

  @Get('deleted')
  @UseGuards(JwtAuthGuard)
  async findDeleted() {
    return await this.entidadesService.findDeleted();
  }

  @Get('search')
  @UseGuards(JwtAuthGuard)
  async search(@Query('nome') nome: string) {
    if (!nome || nome.trim() === '') {
      return [];
    }
    return await this.entidadesService.searchByNome(nome);
  }

  @Get('tipo/:tipo')
  @UseGuards(JwtAuthGuard)
  async findByTipo(@Param('tipo') tipo: TipoEntidade) {
    return await this.entidadesService.findByTipo(tipo);
  }

  @Get('documento/:documento')
  @UseGuards(JwtAuthGuard)
  async findByDocument(@Param('documento') documento: string) {
    return await this.entidadesService.findByDocument(documento);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.entidadesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEntidadeDto: UpdateEntidadeDto
  ) {
    return await this.entidadesService.update(id, updateEntidadeDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.entidadesService.remove(id);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return await this.entidadesService.restore(id);
  }
}