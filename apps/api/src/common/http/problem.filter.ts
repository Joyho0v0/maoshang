import { Catch, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import { ProblemError } from './problem.js';

@Catch(ProblemError)
export class ProblemExceptionFilter implements ExceptionFilter<ProblemError> {
  catch(exception: ProblemError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{ status: (code: number) => { type: (value: string) => { send: (body: unknown) => void } } }>();
    response.status(exception.status).type('application/problem+json').send(exception.problem);
  }
}
