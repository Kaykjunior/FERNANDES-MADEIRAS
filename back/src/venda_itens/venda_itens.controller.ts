import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards
} from '@nestjs/common';
import { VendaItensService } from './venda_itens.service';
import { CreateVendaItemDto } from './dto/create-venda_iten.dto';
import { UpdateVendaItemDto } from './dto/update-venda_iten.dto';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';

@Controller('venda-itens')
@UseGuards(JwtAuthGuard)
export class VendaItensController {
  constructor(private readonly vendaItensService: VendaItensService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createVendaItemDto: CreateVendaItemDto) {
    return this.vendaItensService.create(createVendaItemDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.vendaItensService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) { // CERTIFIQUE-SE QUE É string
    return this.vendaItensService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string, // CERTIFIQUE-SE QUE É string
    @Body() updateVendaItemDto: UpdateVendaItemDto,
  ) {
    return this.vendaItensService.update(id, updateVendaItemDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) { // CERTIFIQUE-SE QUE É string
    return this.vendaItensService.remove(id);
  }
}