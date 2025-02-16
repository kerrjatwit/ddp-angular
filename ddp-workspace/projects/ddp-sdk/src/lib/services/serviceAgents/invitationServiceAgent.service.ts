import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { NotAuthenticatedServiceAgent } from './notAuthenticatedServiceAgent.service';
import { ConfigurationService } from '../configuration.service';
import { LoggingService } from '../logging.service';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { InvitationCheckPayload } from '../../models/invitationCheckPayload';
import { DdpError } from '../../models/ddpError';
import { ErrorType } from '../../models/errorType';

@Injectable()
export class InvitationServiceAgent extends NotAuthenticatedServiceAgent<any> {
    private readonly OK_STATUS = 200;

    constructor(
        @Inject('ddp.config') _configuration: ConfigurationService,
        _http: HttpClient,
        _logger: LoggingService) {
        super(_configuration, _http, _logger);
    }

    public check(invitationId: string, recaptchaToken: string, zipCode: string): Observable<any> {
        const payload: InvitationCheckPayload = {
            invitationId,
            qualificationDetails: {
                zipCode
            },
            recaptchaToken,
            auth0ClientId: this.configuration.auth0ClientId
        };
        return this.postObservable(`/studies/${this.configuration.studyGuid}/invitation-check`, payload, {}, true)
            .pipe(
                map(response => response ? response.body : null),
                catchError((err: HttpErrorResponse) => {
                    return throwError(this.buildErrorObject(err));
                })
            );
    }

    public verify(invitationId: string): Observable<never> {
        return this.postObservable(`/studies/${this.configuration.studyGuid}/invitation-verify`, { invitationId })
            .pipe(
                mergeMap(response => response && response.status === this.OK_STATUS ? EMPTY : throwError('Email verification failed'))
            );
    }

    private buildErrorObject(serverError: HttpErrorResponse): DdpError {
        return new DdpError(this.buildErrorMessage(serverError), this.buildErrorType(serverError));
    }

    private buildErrorMessage(serverError: HttpErrorResponse): string {
        return serverError.error ? serverError.error.message : '';
    }

    private buildErrorType(serverError: HttpErrorResponse): ErrorType {
        if (serverError.error && Object.values(ErrorType).includes(serverError.error.code)) {
            return serverError.error.code;
        }
        return ErrorType.UnknownError;
    }
}
