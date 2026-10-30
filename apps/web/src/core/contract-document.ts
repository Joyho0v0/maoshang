import { parse } from 'yaml';

import source from '../../../../packages/contracts/openapi/openapi.yaml?raw';

export const frozenOpenApiDocument = parse(source) as Record<string, unknown>;
