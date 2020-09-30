import { Component, OnInit } from '@angular/core';
import { HeaderConfigurationService } from 'toolkit';

@Component({
  selector: 'welcome',
  templateUrl: './welcome.component.html'
})
export class WelcomeComponent implements OnInit {
  constructor(private headerConfig: HeaderConfigurationService) { }

  public ngOnInit(): void {
    this.headerConfig.setupDefaultHeader();
  }
}
