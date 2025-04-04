import { Module } from '@nestjs/common';
import { RunUpdateTaskService } from './run-update.service';

@Module({
    imports: [],
    providers: [RunUpdateTaskService],
    exports: [RunUpdateTaskService],
})
export class RunUpdateModule {}
