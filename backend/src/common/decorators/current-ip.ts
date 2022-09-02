import { createParamDecorator } from '@nestjs/common';

import * as requestIp from 'request-ip';

export const IpAddress = createParamDecorator((data, request) => {
    return requestIp.getClientIp(request.switchToHttp().getRequest());
});
