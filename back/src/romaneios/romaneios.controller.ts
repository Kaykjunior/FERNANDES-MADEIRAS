import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RomaneiosService } from './romaneios.service';
import { CreateRomaneioDto } from './dto/create-romaneio.dto';
import { UpdateRomaneioDto } from './dto/update-romaneio.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('romaneios')
export class RomaneiosController {
  constructor(private readonly romaneiosService: RomaneiosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createRomaneioDto: CreateRomaneioDto) {
    return this.romaneiosService.create(createRomaneioDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.romaneiosService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.romaneiosService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateRomaneioDto: UpdateRomaneioDto) {
    return this.romaneiosService.update(+id, updateRomaneioDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.romaneiosService.remove(+id);
  }
}
