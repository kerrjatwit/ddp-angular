import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { LoggingService } from './logging.service';
import { ConfigurationService } from './configuration.service';
import { UserServiceAgent } from './serviceAgents/userServiceAgent.service';
import { SessionMementoService } from './sessionMemento.service';
import { FileUploadBody } from '../models/fileUploadBody';
import { FileUploadResponse } from '../models/fileUploadResponse';

@Injectable()
export class FileUploadService extends UserServiceAgent<any> {

    constructor(
        session: SessionMementoService,
        @Inject('ddp.config') configuration: ConfigurationService,
        http: HttpClient,
        logger: LoggingService) {
        super(session, configuration, http, logger, null);
    }

    getUploadUrl(studyGuid: string, activityGuid: string, questionStableId: string, file: File): Observable<FileUploadResponse> {
        const path = `/studies/${studyGuid}/activities/${activityGuid}/uploads`;

        const requestBody: FileUploadBody = {
            questionStableId,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type
        };

        return this.postObservable(path, requestBody, {}, true).pipe(
            catchError(error => {
                this.logger.logDebug('getUploadUrl error', error);
                return throwError(error.error);
            }),
            map(x => !!x ? x.body as FileUploadResponse : null)
        );
    }

    // Upload a file to GCP Bucket via an authorized upload URL (received in `getUploadUrl` method above)
    uploadFile(path: string, file: File): any {
        const headers = new HttpHeaders({
            'Content-Type': file.type
        });

        return this.http.put(path, file, {headers}).pipe(
            catchError(error => {
                this.logger.logDebug('uploadFile to GCP Bucket error', error);
                return throwError(error.error);
            })
        );
    }
}
