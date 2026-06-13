import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../../usuario/entities/usuario.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true; // Se não tem role definida, libera (desde que esteja logado)
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    // O usuário precisa ter o cargo exigido OU ser ADMIN (Admin acessa tudo no ERP geralmente)
    return requiredRoles.some((role) => user.cargo === role) || user.cargo === UserRole.ADMIN;
  }
}