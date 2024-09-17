import { Module } from '@nestjs/common';
import { TransfereGovApiService, TransfereGovApiTransferenciasService } from './transfere-gov-api.service';

@Module({
    providers: [TransfereGovApiService, TransfereGovApiTransferenciasService],
    exports: [TransfereGovApiService, TransfereGovApiTransferenciasService],
})
export class TransfereGovApiModule {}
