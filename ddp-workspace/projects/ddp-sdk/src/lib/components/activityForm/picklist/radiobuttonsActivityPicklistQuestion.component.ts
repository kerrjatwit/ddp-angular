import { Component } from '@angular/core';
import { ActivityPicklistAnswerDto } from '../../../models/activity/activityPicklistAnswerDto';
import { ActivityPicklistOption } from '../../../models/activity/activityPicklistOption';
import { BaseActivityPicklistQuestion } from './baseActivityPicklistQuestion.component';
import { NGXTranslateService } from '../../../services/internationalization/ngxTranslate.service';

@Component({
    selector: 'ddp-activity-radiobuttons-picklist-question',
    template: `
    <div>
        <label id="radio-group-label" *ngIf="block.label" [innerHTML]="block.label"></label>
        <mat-radio-group class="ddp-radio-group-column" aria-labelledby="radio-group-label">
            <div *ngFor="let option of block.picklistOptions" class="margin-5">
                <mat-radio-button
                            [checked]="getOptionSelection(option.stableId)"
                            [value]="option.stableId"
                            [disabled]="readonly"
                            [disableRipple]="true"
                            (change)="optionChanged(option); option.allowDetails ? updateCharactersLeftIndicator(option.stableId) : null">
                    {{option.optionLabel}}
                    <ddp-tooltip *ngIf="option.tooltip" class="tooltip" [text]="option.tooltip"></ddp-tooltip>
                </mat-radio-button>
                <ng-container *ngIf="option.allowDetails && getOptionSelection(option.stableId)">
                    <mat-form-field class="ddp-option-details-field">
                        <input matInput
                               (change)="detailTextChanged($event.target.value, option.stableId)"
                               (input)="updateCharactersLeftIndicator(option.stableId, $event.target.value)"
                               [disabled]="readonly"
                               [attr.maxlength]="block.detailMaxLength"
                               [placeholder]="option.detailLabel"
                               [value]="getAnswerDetailText(option.stableId)">
                    </mat-form-field>
                    <p *ngIf="!readonly" class="ddp-helper">
                        <span class="ddp-counter-color">
                            {{ questionIdToCharactersLeft[option.stableId] }}
                        </span>{{ questionIdToCharacterLeftMsg[option.stableId] }}
                    </p>
                </ng-container>
            </div>
        </mat-radio-group>
    </div>`,
    styles: [
        `.margin-5 {
            margin: 5px;
            display: flex;
            flex-direction: column;
        }

        .margin-bottom {
            margin-bottom: 15px
        }

        .example-input-field{
            width: 50%;
        }

        .ddp-radio-group-row {
            display: flex;
            flex-direction: row;
        }

        .ddp-radio-group-column {
            display: flex;
            flex-direction: column;
        }

        :host ::ng-deep
        .mat-radio-label {
            align-items: normal !important;
            white-space: normal !important;
        }`
    ]
})
export class RadioButtonsActivityPicklistQuestion extends BaseActivityPicklistQuestion {
    constructor(private translate: NGXTranslateService) {
        super(translate);
    }

    public detailTextChanged(value: string, id: string): void {
        if (this.block.answer) {
            this.block.answer.forEach((item, i) => {
                if (item.stableId === id) {
                    this.block.answer[i].detail = value;
                }
            });
            this.valueChanged.emit(this.block.answer);
        }
    }

    public getOptionSelection(id: string): boolean {
        let selected = false;
        if (this.block.answer) {
            this.block.answer.forEach((item) => {
                if (item.stableId === id) {
                    selected = true;
                }
            });
        }
        return selected;
    }

    public optionChanged(option: ActivityPicklistOption): void {
        const { stableId } = option;
        const answer = {} as ActivityPicklistAnswerDto;
        answer.stableId = stableId;
        answer.detail = this.getAnswerDetailText(stableId);
        this.block.answer = [answer];
        this.valueChanged.emit(this.block.answer);
    }
}
