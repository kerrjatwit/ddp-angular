import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, Inject } from '@angular/core';
import { ActivityCompositeQuestionBlock } from '../../../../models/activity/activityCompositeQuestionBlock';
import { AnswerValue } from '../../../../models/activity/answerValue';
import { ActivityQuestionBlock } from '../../../../models/activity/activityQuestionBlock';
import { ChildOrientation } from '../../../../models/activity/childOrientation';
import { QuestionType } from '../../../../models/activity/questionType';
import { ActivityDateQuestionBlock } from '../../../../models/activity/activityDateQuestionBlock';
import { DateRenderMode } from '../../../../models/activity/dateRenderMode';
import { ConfigurationService } from '../../../../services/configuration.service';
import * as _ from 'underscore';

// todo see if style in here can be moved to shared resource, like external CSS

@Component({
    selector: 'ddp-activity-composite-answer',
    templateUrl: 'activityCompositeAnswer.component.html',
    styleUrls: ['activityCompositeAnswer.component.scss']
})

// todo can we make some of these styles be common? button styles copied from physician form
export class ActivityCompositeAnswer implements OnChanges {
    @Input() block: ActivityCompositeQuestionBlock;
    @Input() readonly: boolean;
    @Input() validationRequested: boolean;
    @Output() valueChanged: EventEmitter<AnswerValue> = new EventEmitter();
    @Output() componentBusy = new EventEmitter<boolean>();
    public childQuestionBlocks: ActivityQuestionBlock<any>[][] = [];
    private convertQuestionToLabels: boolean;

    constructor(@Inject('ddp.config') public config: ConfigurationService) { }

    public ngOnChanges(changes: SimpleChanges): void {
        for (const propName in changes) {
            if (propName === 'block') {
                const newBlock: ActivityCompositeQuestionBlock = changes['block'].currentValue;
                if (changes[propName].isFirstChange()) {
                    this.convertQuestionToLabels = this.shouldSetLabelToBeQuestionText(newBlock.children);
                }
                const newAnswers: any[][] | null = newBlock.answer;
                if (!newAnswers || newAnswers.length === 0) {
                    // Case where we don't have any initial answers. We still need that first row!
                    this.childQuestionBlocks = [];
                    this.addBlankRow();
                } else {
                    const questionsRows: ActivityQuestionBlock<any>[][] = newAnswers.map((rowOfAnswers: ActivityQuestionBlock<any>[]) => {
                        // assuming order of answers same as order of questions here.
                        // And adding braces and a return statement here fixes a bug that should not be happening
                        // Breaks when running the compiled version of SDK  but OK when including library via symlink
                        // TODO investigate what is going on. Perhaps differences in TypeScript compiler target Javascript config?
                        return rowOfAnswers.map((answerContainer: ActivityQuestionBlock<any>, index: number) =>
                            this.buildBlockForChildQuestion(newBlock.children[index], answerContainer, newBlock.shown));
                    });

                    const blankRow: ActivityQuestionBlock<any>[] = this.block.children.map((questionBlock: ActivityQuestionBlock<any>) =>
                        this.buildBlockForChildQuestion(questionBlock, null, this.block.shown));

                    // If a row in Composite block has 2 and more questions,
                    // and a user answered only on the first question and reloaded the page
                    // the backend returns an array of answers only with 1 item,
                    // so when the component will build rows, we will miss some blocks
                    // example: https://broadinstitute.atlassian.net/browse/DDP-4536;
                    // method below looks which blocks were missed and add them
                    // Important: if a user answered only on the last question, backend returns the correct array of answers
                    this.childQuestionBlocks = questionsRows.map((currentRow: ActivityQuestionBlock<any>[]) => {
                        if (currentRow.length !== blankRow.length) {
                            const missedQuestions = blankRow.slice(currentRow.length);
                            currentRow.push(...missedQuestions);
                        }
                        return currentRow;
                    });
                }
            }
        }
    }

    // Use original child question blocks as the prototypes to make real working ones
    // tslint:disable-next-line:max-line-length
    private buildBlockForChildQuestion(childQuestionBlock: ActivityQuestionBlock<any>, answerContainer: any, shown: boolean): ActivityQuestionBlock<any> {
        // Each child will need its own copy of the block to work properly
        const newQuestionBlock: ActivityQuestionBlock<any> = this.deepClone(childQuestionBlock);
        newQuestionBlock.validators = childQuestionBlock.validators.map((each) => this.deepClone(each));
        if (this.convertQuestionToLabels && !newQuestionBlock.label) {
            newQuestionBlock.label = childQuestionBlock.question;
            newQuestionBlock.question = '';
        }
        if (this.shouldSetPlaceholderToBeQuestionText(childQuestionBlock)) {
            newQuestionBlock.placeholder = newQuestionBlock.question;
            newQuestionBlock.question = '';
            if (childQuestionBlock.isRequired && this.showAsterisk(childQuestionBlock.questionType)) {
                newQuestionBlock.placeholder += ' *';
            }
        }
        if (this.block.childOrientation === ChildOrientation.Horizontal) {
            newQuestionBlock.question = '';
        }
        // clone does not update references to original object. we need to do that here.
        newQuestionBlock.validators.forEach((validator) => validator.question = newQuestionBlock);
        newQuestionBlock.answer = answerContainer === null ? null : answerContainer.value;
        newQuestionBlock.shown = shown;

        return newQuestionBlock;
    }

    // We assume question prompt should be used as placeholder in certain situations.
    // Relax this assumption if API adds an indicator for this.
    private shouldSetPlaceholderToBeQuestionText(childQuestionBlock: ActivityQuestionBlock<any>): boolean {
        return childQuestionBlock.question && !childQuestionBlock.placeholder
            && [QuestionType.Text, QuestionType.Date, QuestionType.Numeric].includes(childQuestionBlock.questionType);
    }

    public updateValue(row: number, column: number, value: AnswerValue): void {
        this.childQuestionBlocks[row][column].answer = value;
        const childAnswers = this.buildComponentAnswers();
        this.block.setAnswer(childAnswers, false);
        // No point in emitting if the value is not valid. Not gonna patch it anyways
        if (this.childQuestionBlocks[row][column].validate()) {
            const compositeAnswerValue: any[][] = this.childQuestionBlocks.map(childQuestionBlockRow =>
                childQuestionBlockRow.map((childQuestionBlock) => {
                    if (childQuestionBlock.validate()) {
                        return this.buildChildAnswer(childQuestionBlock);
                    } else {
                        return this.buildChildAnswer(childQuestionBlock, null);
                    }
                }));
            this.valueChanged.emit(compositeAnswerValue);
        }
    }

    public setOrientationClass(orientation: ChildOrientation | null): string {
        return Object.values(ChildOrientation).includes(orientation) ? orientation.toLowerCase() : '';
    }

    private buildComponentAnswers(): any[][] {
        return this.childQuestionBlocks.map(childQuestionBlockRow =>
            childQuestionBlockRow.map((childQuestionBlock) => {
                return this.buildChildAnswer(childQuestionBlock);
            }));
    }

    private buildChildAnswer(childQuestionBlock: ActivityQuestionBlock<any>, answer?: any): any {
        return {
            stableId: childQuestionBlock.stableId,
            value: _.isUndefined(answer) ? childQuestionBlock.answer : answer
        };
    }

    public addBlankRow(): void {
        this.childQuestionBlocks.push(this.block.children.map(questionBlock =>
            this.buildBlockForChildQuestion(questionBlock, null, this.block.shown)));
    }

    public removeRow(index: number): void {
        this.childQuestionBlocks.splice(index, 1);
        this.valueChanged.emit(this.buildComponentAnswers());
    }

    // We need this method because we want to include the prototype in the clone.
    // Underscore's _.clone doesn't allow it.
    private deepClone<T>(block: T): T {
        return Object.create(Object.getPrototypeOf(block), Object.getOwnPropertyDescriptors(block));
    }

    // we will show labels if we have a question with a picklist date. Placeholder is not available
    private shouldSetLabelToBeQuestionText(childQuestionBlocks: ActivityQuestionBlock<any>[]): boolean {
        return childQuestionBlocks
            .filter(block => block.questionType === QuestionType.Date
                && (block as ActivityDateQuestionBlock).renderMode === DateRenderMode.Picklist
            )
            .length > 0;
    }

    private showAsterisk(questionType: QuestionType): boolean {
        return !this.config.compositeRequiredFieldExceptions.includes(questionType);
    }
}
