import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole, Usuario } from './entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuarioService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>, // Aqui declaramos o 'repo'
  ) { }

  // CRIA O ADMIN AUTOMÁTICO QUANDO O SISTEMA SOBE
  async onModuleInit() {
    const admin = await this.repo.findOne({ where: { cargo: UserRole.ADMIN } });
    if (!admin) {
      const hash = await bcrypt.hash('admin123', 10);
      await this.repo.save({
        nome: 'Admin Inicial',
        email: 'admin@admin.com',
        senhaHash: hash, // CORRIGIDO: de senha_hash para senhaHash
        cargo: UserRole.ADMIN,
        ativo: true,
        comissao_percentual: 0
      });
      console.log('✅ Admin inicial criado: admin@admin.com / admin123');
    }
  }

  async create(dto: CreateUsuarioDto) {
    const { senha, ...rest } = dto;
    const emailExists = await this.repo.findOne({ where: { email: dto.email } });
    if (emailExists) {
      throw new ConflictException('Este e-mail já está cadastrado no sistema.');
    }
    const hash = await bcrypt.hash(senha, 10);

    const novo = this.repo.create({
      ...rest,
      senhaHash: hash
    });

    return await this.repo.save(novo);
  }

  async findByEmailWithPassword(email: string) {
    return await this.repo.findOne({
      where: { email },
      select: ['id', 'email', 'senhaHash', 'cargo', 'ativo', 'nome'],
    });
  }

  async findAll() {
    return await this.repo.find();
  }

  async findOne(id: string) { // Mudado para string pois usamos UUID
    const usuario = await this.repo.findOne({ where: { id } });
    if (!usuario) throw new NotFoundException('Usuário não encontrado');
    return usuario;
  }

  async update(id: string, updateUsuarioDto: UpdateUsuarioDto) {
    const usuario = await this.findOne(id);
    this.repo.merge(usuario, updateUsuarioDto);
    return await this.repo.save(usuario);
  }

  async remove(id: string) {
    const usuario = await this.findOne(id);
    return await this.repo.softRemove(usuario); // Usa o deleted_at do seu SQL
  }
}