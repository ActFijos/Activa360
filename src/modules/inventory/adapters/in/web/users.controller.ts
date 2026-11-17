import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@ApiTags('usuarios')
@Controller('usuarios')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({
    summary: 'Listar usuarios del sistema',
    description: 'Recupera el listado completo de usuarios registrados en el sistema Activa360.',
  })
  @ApiResponse({ status: 200, description: 'Listado de usuarios obtenido' })
  async getAll() {
    return this.prisma.user.findMany();
  }

  @Post()
  @ApiOperation({
    summary: 'Crear nuevo usuario del sistema',
    description: 'Registra un nuevo usuario con rol de Administrador, Supervisor o Inventariador.',
  })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  async create(@Body() body: any) {
    return this.prisma.user.create({
      data: {
        fullName: body.fullName,
        ci: body.ci,
        phone: body.phone,
        role: body.role,
        username: body.username,
        cargo: body.cargo,
        password: body.password || '123456',
      },
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar datos de un usuario',
    description: 'Actualiza los datos de perfil o rol de un usuario existente.',
  })
  @ApiParam({ name: 'id', description: 'ID único del usuario a actualizar' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.prisma.user.update({
      where: { id },
      data: {
        fullName: body.fullName,
        ci: body.ci,
        phone: body.phone,
        role: body.role,
        username: body.username,
        cargo: body.cargo,
        password: body.password,
      },
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar usuario del sistema',
    description: 'Elimina el registro de un usuario por su identificador único.',
  })
  @ApiParam({ name: 'id', description: 'ID único del usuario a eliminar' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  async delete(@Param('id') id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
