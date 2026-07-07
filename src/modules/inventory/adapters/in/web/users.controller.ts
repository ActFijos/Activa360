import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { PrismaService } from '../../../../compliance/adapters/out/db/prisma.service.js';

@Controller('usuarios')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAll() {
    return this.prisma.user.findMany();
  }

  @Post()
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
  async remove(@Param('id') id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
