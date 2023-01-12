import { ApiProperty } from "@nestjs/swagger";
import { PerfilAcessoPrivilegios } from "../../pessoa/dto/perifl-acesso-privilegios.dto";

export class PerfilDeAcessoLinhaDto {
    @ApiProperty({ description: 'Lista de perfil de acesso', })
    linhas: PerfilAcessoPrivilegios[];
}