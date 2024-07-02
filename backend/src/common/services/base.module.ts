import { Module } from '@nestjs/common';
import { SmaeConfigModule } from './smae-config.module';

@Module({
    imports: [SmaeConfigModule],
})
export class CommonBaseModule {}
