import {Injectable} from '@angular/core';
import {Subject} from 'rxjs/Subject';
import {ComponentType} from '@angular/cdk/portal';
import { MatDialogRef } from '@angular/material/dialog';
import { SliderRef } from '../../slides/SliderRef';
import { DialogData, Slide } from '../../shared/models/common.info';


class SlideDialogSubject {
    id: string;
    dialogRef: MatDialogRef<any>;
    subject: Subject<any>;
    slideRefs: SliderRef[]
}

@Injectable({
    providedIn: 'root'
})
export class SlideService {
    private dialogSubjects: SlideDialogSubject[] = [];

    constructor() {
    }


    createSlide(componentType: ComponentType<any>, data: DialogData, dialogRef: MatDialogRef<any>) {
        let dialogSubject = this.getCurrentDialogSubject(dialogRef);
        
        let slideRef = new SliderRef(dialogSubject.subject, dialogRef);
        let slide = new Slide({
            component: componentType,
            data: data,
            slideRef: slideRef
        });
        // Trigger create slide
        dialogSubject.subject.next({
            action: 'createSlide',
            slide: slide
        });

        // Push slideRef
        dialogSubject.slideRefs.push(slideRef);

        slideRef.afterClosedSubject.subscribe(x => {            
            let idx = dialogSubject.slideRefs.findIndex(r => r === slideRef);

            if (idx >= 0) {                               
                dialogSubject.slideRefs.splice(idx, 1);
            }
        });

        return slideRef;
    }

    /**
     * Register event for dialogRef
     * @param {MatDialogRef<any>} dialogRef
     * @param callback
     * @returns {Subscription}
     */
    subscribe(dialogRef: MatDialogRef<any>, callback) {
        let subject = new Subject();
        this.dialogSubjects.push({
            id: dialogRef.id,
            dialogRef: dialogRef,
            subject: subject,
            slideRefs: []
        });
        return subject.subscribe(callback);
    }

    unsubscribe(dialogRef: MatDialogRef<any>) {
        let index = this.dialogSubjects.findIndex((item) => {
            return item.id === dialogRef.id;
        });
        if (index !== -1) {
            this.dialogSubjects[index].subject.unsubscribe();
            this.dialogSubjects.splice(index, 1);
        }
    }

    /**
     * Get current DialogSubject from dialogRef
     * @param {MatDialogRef<any>} dialogRef
     * @returns {SlideDialogSubject}
     */
    getCurrentDialogSubject(dialogRef?: MatDialogRef<any>): SlideDialogSubject {
        if (dialogRef) {
            let matched = this.dialogSubjects.find((item) => {
                return item.id === dialogRef.id;
            });
            if (matched) {
                return matched;
            } else {
                throw 'Error get current slide';
            }
        } else {
            return this.dialogSubjects[this.dialogSubjects.length - 1];
        }
    }
}
