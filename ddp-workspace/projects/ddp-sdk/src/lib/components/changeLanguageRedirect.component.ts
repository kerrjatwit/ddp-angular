import { Component, Inject, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable } from "rxjs";
import { map, take } from "rxjs/operators";
import { StudyLanguage } from "../models/studyLanguage";
import { ConfigurationService } from "../services/configuration.service";
import { LanguageService} from "../services/languageService.service";
import { LanguageServiceAgent } from "../services/serviceAgents/languageServiceAgent.service";

@Component({
  selector: 'ddp-change-language-redirect',
  template: `<ng-container></ng-container>`
})
export class ChangeLanguageRedirectComponent implements OnInit {
  private lang: string = null;
  private supportedLanguages: StudyLanguage[] = null;

  //The destination to redirect to, relative to the main site
  private dest: string = null;

  //Optionally, a parameter to pass through to the destination to redirect to
  private queryParamValue: string = null;

  constructor(
    private languageService: LanguageService,
    private languageServiceAgent: LanguageServiceAgent,
    private route: ActivatedRoute,
    private router: Router,
    @Inject('ddp.config') private config: ConfigurationService) {
  }

  public ngOnInit(): void {
    //Get the specified language and specified destination and store for later
    let paramPromise: Promise<void> = this.getParamInfo();

    //Get any parameters to pass through to specified destination
    let queryParamPromise: Promise<void> = this.getQueryParamInfo();

    //Get the study's configured languages and store for later
    let supportedLanguagesPromise: Promise<void> = this.getSupportedLanguagesPromise();

    //Attempt to change language and redirect
    Promise.all([paramPromise, queryParamPromise, supportedLanguagesPromise])
      .then(() => {
        //Add the configured languages
        this.languageService.addLanguages(this.supportedLanguages.map(x => x.languageCode));

        //Try to switch to the specified language
        let langChangePromise: Promise<any> = this.languageService.changeLanguagePromise(this.lang);
        langChangePromise.catch(reason => {
          console.log(`Could not change language to ${this.lang}: ${reason}.`);
        }).then(() => {
          console.log(`Changed language to ${this.languageService.getCurrentLanguage()}`);
        }).finally(() => {
          //Do the redirect
          let destName = this.dest;
          if (this.queryParamValue) {
            destName = destName + '/' + this.queryParamValue;
          }

          this.router.navigate([destName], {relativeTo: this.route.root});
          });
      });
  }

  private getSupportedLanguagesPromise(): Promise<void> {
    return this.getPromiseFromObservable(this.languageServiceAgent.getConfiguredLanguages(this.config.studyGuid),
      (languages => {this.supportedLanguages = languages}));
  }

  private getParamInfo(): Promise<void> {
    return this.getPromiseFromObservable(this.route.paramMap, (params => {
      this.lang = params.get('language');
      this.dest = params.get('destination');
    }));
  }

  private getQueryParamInfo(): Promise<void> {
    return this.getPromiseFromObservable(this.route.queryParamMap, (queryParams => {
      if (queryParams.has('destParamValue')) {
        this.queryParamValue = queryParams.get('destParamValue');
      }
    }));
  }

  private getPromiseFromObservable(obs: Observable<any>, callback: (obsResult: any) => any): Promise<void> {
    //Return a promise that calls the provided callback with the first value returned from the observable
    return obs.pipe(take(1))
      .pipe(map(x => callback(x))).toPromise();
  }
}
