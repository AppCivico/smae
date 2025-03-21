import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Sincronização de Cadastro Básico')
@Controller('sync-cadastro-basico')
export class SyncCadastroBasicoController {
    constructor(private readonly syncCadastroBasicoService: SyncCadastroBasicoController) {}
}
