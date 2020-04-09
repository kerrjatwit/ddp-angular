import { Component } from '@angular/core';

@Component({
  selector: 'app-data-access',
  templateUrl: './data-access.html',
  styleUrls: ['./data-access.scss']
})
export class DataAccessComponent {
  public name;
  public email;

  public orgname;
  public address1;
  public city;
  public country;
  public zip;

  public description;
  public use;

  public sign;

  public activeTab = 0;
  public countTabs = new Array(7);
  public todayString = this.getToday();

  public displayDontHaveErrors(tab: number) {
    if (tab === 1) {
      return this.name && this.email;
    } else if (tab === 2) {
      return this.orgname && this.address1 && this.city && this.country && this.zip;
    } else if (tab === 3) {
      return this.description && this.use;
    } else if (tab === 6) {
      return this.sign;
    }
    return true;
  }

  public setActiveTab(event: Event, index: number) {
    event.preventDefault();
    this.activeTab = index;
  }

  public getToday() {
    const data = new Date();
    const mouth = data.getMonth() + 1;
    const day = data.getDay();
    return data.getFullYear() + '-' + (mouth > 9 ? mouth : '0' + mouth) + '-' + (day > 9 ? day : '0' + day);
  }

  public submit(form) {
    if (form.invalid) {
      form.submitted = true;
      this.countTabs.find((val, i) => {
        if (!this.displayDontHaveErrors(i)) {
          this.activeTab = i;
          return true;
        }
      });
    }
  }
}
