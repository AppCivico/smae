import { Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Request } from 'express';
import { extractIpAddress } from '../../common/decorators/current-ip';

@Injectable()
export class SmaeThrottlerGuard extends ThrottlerGuard {
    constructor(
        @Optional() @Inject('THROTTLER:MODULE_OPTIONS') options: ThrottlerModuleOptions,
        @Optional() storage: ThrottlerStorage,
        reflector: Reflector
    ) {
        // Handle missing options gracefully for worker/run-task context
        if (!options) {
            super({ throttlers: [] } as any, storage, reflector);
            return;
        }
        super(options, storage, reflector);
    }

    protected async getTracker(req: Request): Promise<string> {
        return extractIpAddress(req);
    }
}
