import { Module } from '@nestjs/common';
import {
    TransfereGovApiOportunidadesApiService,
    TransfereGovApiService,
    TransfereGovApiTransferenciasService,
} from './transfere-gov-api.service';

@Module({
    providers: [TransfereGovApiService, TransfereGovApiTransferenciasService, TransfereGovApiOportunidadesApiService],
    exports: [TransfereGovApiService, TransfereGovApiTransferenciasService, TransfereGovApiOportunidadesApiService],
})
export class TransfereGovApiModule {}
