import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Auth0AdapterService, CompositeDisposable, NGXTranslateService } from 'ddp-sdk';
import { PopupMessage } from '../../toolkit/models/popupMessage';
import { AtcpCommunicationService } from '../../toolkit/services/communication.service';

@Component({
    selector: 'app-account-activation-required',
    template: `<p></p>`
})
export class AccountActivationRequiredComponent implements OnInit, OnDestroy {
  private anchor = new CompositeDisposable();

  constructor(
        private httpClient: HttpClient,
        private route: ActivatedRoute,
        private auth0: Auth0AdapterService,
        private communicationService: AtcpCommunicationService,
        private ngxTranslate: NGXTranslateService) { }

    public ngOnInit(): void {
     this.anchor.addNew(this.ngxTranslate.getTranslation('AccountActivation.AccountActivationRequired')
        .subscribe((translationResult: string) => {
            this.communicationService
              .showPopupMessage(new PopupMessage(translationResult,
                true));
        }));
    }

  ngOnDestroy(): void {
    this.anchor.removeAll();
  }
}
