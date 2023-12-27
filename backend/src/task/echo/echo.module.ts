import { Module } from '@nestjs/common';
import { EchoService } from './echo.service';

@Module({
    providers: [EchoService],
    exports: [EchoService]
})
export class EchoModule {}
