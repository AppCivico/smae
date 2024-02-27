import { ApiProperty } from '@nestjs/swagger';
import { ModuloSistema } from '@prisma/client';

class Privilegio {
    @ApiProperty({ description: 'Nome do privilégio' })
    nome: string;
}

class PrivilegioData {
    @ApiProperty({ description: 'Detalhes do privilegio' })
    privilegio: Privilegio;
}

export class PerfilAcessoPrivilegios {
    @ApiProperty({ description: 'id' })
    id: number;
    @ApiProperty({ description: 'nome' })
    nome: string;
    @ApiProperty({ description: 'Descrição' })
    descricao?: string;

    @ApiProperty({ description: 'Lista dos privilégios' })
    perfil_privilegio: PrivilegioData[];

    @ApiProperty({ isArray: true, enumName: 'ModuloSistema', enum: ModuloSistema })
    modulos_sistemas: ModuloSistema[];

    autogerenciavel: boolean;
}
