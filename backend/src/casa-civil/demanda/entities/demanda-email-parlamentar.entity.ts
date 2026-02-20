import { ApiProperty } from '@nestjs/swagger';

export class DemandaEmailParlamentarDto {
    @ApiProperty()
    id: string; // UUID do email na fila

    @ApiProperty()
    parlamentar: {
        id: number;
        nome: string;
        nome_popular: string;
        cargo: string;
        partido: string;
        uf: string;
    } | null;

    @ApiProperty()
    email_enviado: string;

    @ApiProperty()
    assunto: string;

    @ApiProperty()
    criado_em: string;
}

export class ListDemandaEmailParlamentarDto {
    linhas: DemandaEmailParlamentarDto[];
}
