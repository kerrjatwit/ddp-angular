import { Component, EventEmitter, Input, Output } from '@angular/core';

import { ActivityInstance } from 'ddp-sdk';

import {
  COMPLETE,
  CREATED,
  IN_PROGRESS,
} from '../workflow-progress/workflow-progress';

@Component({
  selector: 'atcp-user-activities',
  templateUrl: './user-activities.component.html',
  styleUrls: ['./user-activities.component.scss'],
})
export class UserActivitiesComponent {
  @Input() activities: ActivityInstance[];
  @Input() displayedColumns = [
    'activityName',
    'activitySummary',
    'createdAt',
    'questionCount',
    'actions',
  ];
  @Output() startActivity = new EventEmitter<string>();
  @Output() continueActivity = new EventEmitter<string>();
  @Output() viewActivity = new EventEmitter<string>();

  statusCodes = { COMPLETE, CREATED, IN_PROGRESS };

  constructor() {}

  get currentActivity(): ActivityInstance | null {
    const inProgressActivity = this.activities.find(
      activity => activity.statusCode === this.statusCodes.IN_PROGRESS
    );

    if (inProgressActivity) return inProgressActivity;

    const createdActivity = this.activities.find(
      activity => activity.statusCode === this.statusCodes.CREATED
    );

    if (createdActivity) return createdActivity;

    return null;
  }

  showQuestionCount(activity: ActivityInstance): boolean {
    return activity.statusCode === IN_PROGRESS;
  }

  isRowDisabled(activity: ActivityInstance): boolean {
    return activity.statusCode === this.statusCodes.CREATED && activity !== this.currentActivity;
  }
}
