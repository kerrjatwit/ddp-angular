import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { ConfigurationService, LoggingService, SessionMementoService, UserActivityServiceAgent } from 'ddp-sdk';

describe('UserActivityServiceAgent', () => {
    let service: UserActivityServiceAgent;
    let httpTestingController: HttpTestingController;

    const backendUrl = 'https://pepper-dev.datadonationplatform.org';
    const sessionUserGuid = 'sessionUserGuidTest';
    beforeEach(() => {
        const config = new ConfigurationService();
        config.backendUrl = backendUrl;
        const loggingServiceSpy: jasmine.SpyObj<LoggingService> = jasmine.createSpyObj('LoggingService', ['logException']);
        const sessionSpy = new SessionMementoService({} as TranslateService, config);
        spyOnProperty(sessionSpy, 'sessionObservable').and.returnValue(of({ participantGuid: sessionUserGuid }));

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule]
        });

        const httpClient = TestBed.inject(HttpClient);
        httpTestingController = TestBed.inject(HttpTestingController);

        service = new UserActivityServiceAgent(sessionSpy, config, httpClient, loggingServiceSpy, null);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('should be initialized', () => {
        expect(service).not.toBeNull();
    });
});
