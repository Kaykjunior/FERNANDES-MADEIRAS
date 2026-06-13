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
import { EnderecosService } from './enderecos.service';
import { CreateEnderecoDto } from './dto/create-endereco.dto';
import { UpdateEnderecoDto } from './dto/update-endereco.dto';
import { FilterEnderecoDto } from './dto/filter-endereco.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('enderecos')
export class EnderecosController {
  constructor(private readonly enderecosService: EnderecosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createEnderecoDto: CreateEnderecoDto) {
    return await this.enderecosService.create(createEnderecoDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() filterDto: FilterEnderecoDto) {
    return await this.enderecosService.findAll(filterDto);
  }

  @Get('entidade/:entidadeId')
  @UseGuards(JwtAuthGuard)
  async findByEntidade(@Param('entidadeId', ParseUUIDPipe) entidadeId: string) {
    return await this.enderecosService.findByEntidade(entidadeId);
  }

  @Get('cep/:cep')
  @UseGuards(JwtAuthGuard)
  async findByCep(@Param('cep') cep: string) {
    return await this.enderecosService.findByCep(cep);
  }

  @Get('estado/:estado')
  @UseGuards(JwtAuthGuard)
  async findByEstado(@Param('estado') estado: string) {
    return await this.enderecosService.findByEstado(estado);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return await this.enderecosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEnderecoDto: UpdateEnderecoDto
  ) {
    return await this.enderecosService.update(id, updateEnderecoDto);
  }

  @Patch(':id/padrao')
  @UseGuards(JwtAuthGuard)
  async setAsPadrao(@Param('id', ParseUUIDPipe) id: string) {
    return await this.enderecosService.setAsPadrao(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.enderecosService.remove(id);
  }

  @Patch(':id/restore')
  @UseGuards(JwtAuthGuard)
  async restore(@Param('id', ParseUUIDPipe) id: string) {
    return await this.enderecosService.restore(id);
  }
}