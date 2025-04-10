import { ApiProperty } from '@nestjs/swagger';
import { ModuloSistema } from '@prisma/client';
import { MaxLength } from 'class-validator';

class Privilegio {
    @ApiProperty({ description: 'Nome do privilégio' })
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;

    @ApiProperty({ description: 'Código do privilégio', type: 'string' })
    @MaxLength(255, { message: 'O campo "Código" deve ter no máximo 255 caracteres' })
    codigo: string;
}

class PrivilegioData {
    @ApiProperty({ description: 'Detalhes do privilegio' })
    privilegio: Privilegio;
}

export class PerfilAcessoPrivilegios {
    @ApiProperty({ description: 'id' })
    id: number;
    @ApiProperty({ description: 'nome' })
    @MaxLength(255, { message: 'O campo "Nome" deve ter no máximo 255 caracteres' })
    nome: string;
    @ApiProperty({ description: 'Descrição' })
    @MaxLength(2048, { message: 'O campo "Descrição deve ter no máximo 2048 caracteres' })
    descricao?: string | null;

    @ApiProperty({ description: 'Lista dos privilégios' })
    perfil_privilegio: PrivilegioData[];

    @ApiProperty({ isArray: true, enumName: 'ModuloSistema', enum: ModuloSistema })
    modulos_sistemas: ModuloSistema[];

    pode_editar: boolean;

    autogerenciavel: boolean;
}
