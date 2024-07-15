import { task_type } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { CreateEchoDto } from './echo/dto/create-echo.dto';
import { CreateRefreshMvDto } from './refresh_mv/dto/create-refresh-mv.dto';
import { CreateRefreshMetaDto } from './refresh_meta/dto/create-refresh-mv.dto';
import { CreateAvisoEmailJobDto } from './aviso_email/dto/create-aviso_email.dto';
import { CreateAeCronogramaTpJobDto } from './aviso_email_cronograma_tp/dto/ae_cronograma_tp.dto';
import { CreateNotaJobDto } from './aviso_email_nota/dto/ae_nota.dto';
import { CreateRefreshTransferenciaDto } from './refresh_transferencia/dto/create-refresh-transferencia.dto';
import { CreateRefreshIndicadorDto } from './refresh_indicador/dto/create-refresh-indicador.dto';
import { CreateImportacaoParlamentarDto } from './importacao_parlamentar/dto/create-parlamentar.dto';
import { CreateRefreshVariavelDto } from './refresh_variavel/dto/create-refresh-variavel.dto';

export function ParseParams(taskType: task_type, value: any): any {
    let theClass: any = undefined;
    switch (taskType) {
        case 'echo':
            theClass = CreateEchoDto;
            break;
        case 'refresh_mv':
            theClass = CreateRefreshMvDto;
            break;
        case 'refresh_meta':
            theClass = CreateRefreshMetaDto;
            break;
        case 'refresh_transferencia':
            theClass = CreateRefreshTransferenciaDto;
            break;
        case 'refresh_indicador':
            theClass = CreateRefreshIndicadorDto;
            break;
        case 'refresh_variavel':
            theClass = CreateRefreshVariavelDto;
            break;
        case 'aviso_email':
            theClass = CreateAvisoEmailJobDto;
            break;
        case 'aviso_email_cronograma_tp':
            theClass = CreateAeCronogramaTpJobDto;
            break;
        case 'aviso_email_nota':
            theClass = CreateNotaJobDto;
            break;
        case 'importacao_parlamentar':
            theClass = CreateImportacaoParlamentarDto;
            break;

        default:
            taskType satisfies never;
    }

    const validatorObject = plainToInstance(theClass, value);

    return validatorObject;
}
