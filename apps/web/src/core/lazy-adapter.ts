import type { GeneratedContractAdapterOptions } from './contract-adapter';
import type { ApiRequest, ContractAdapter, HttpResponse, LoginInput } from './types';

/**
 * Keeps the generated operation table and Ajv runtime out of the initial SPA
 * chunk while retaining it as the only production adapter implementation.
 */
export function createLazyGeneratedContractAdapter(
  options: GeneratedContractAdapterOptions = {},
): ContractAdapter {
  let adapterPromise: Promise<ContractAdapter> | undefined;
  const load = (): Promise<ContractAdapter> => {
    adapterPromise ??= import('./contract-adapter').then(({ createGeneratedContractAdapter }) => createGeneratedContractAdapter(options));
    return adapterPromise;
  };

  return {
    bootstrap: (signal) => load().then((adapter) => adapter.bootstrap(signal)),
    login: (input: LoginInput, signal) => load().then((adapter) => adapter.login(input, signal)),
    logout: (signal, csrfToken) => load().then((adapter) => adapter.logout(signal, csrfToken)),
    rotateCsrf: (signal) => load().then((adapter) => adapter.rotateCsrf(signal)),
    request: (request: ApiRequest, signal: AbortSignal): Promise<HttpResponse<unknown>> => load().then((adapter) => adapter.request(request, signal)),
  };
}
