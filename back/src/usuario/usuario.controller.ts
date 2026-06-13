import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard'; 
import { Roles } from 'src/modules/auth/decorators/roles.decorator'; 
import { UserRole } from './entities/usuario.entity';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) { }

  // 1. Criação de Usuário (Protegida: Apenas ADMIN cria novos usuários)
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN) 
  create(@Body() createUserDto: CreateUsuarioDto) {
    return this.usuarioService.create(createUserDto);
  }

  // 2. Perfil do usuário logado
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return this.usuarioService.findOne(req.user.userId);
  }

  // 3. Listar todos (Geralmente apenas ADMIN ou GERENTE)
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GERENTE)
  findAll() {
    return this.usuarioService.findAll();
  }

  // 4. Buscar um por ID
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usuarioService.findOne(id); // Removido o '+', pois usamos UUID (string)
  }

  // 5. Atualizar
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuarioService.update(id, updateUsuarioDto);
  }

  // 6. Remover (Soft Delete)
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usuarioService.remove(id);
  }
}