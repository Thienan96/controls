import {Subject} from 'rxjs/Subject';
import { DialogPosition, MatDialogRef } from '@angular/material/dialog';

export class SliderRef {
    componentInstance: any;
    afterClosedSubject: Subject<any> = new Subject();
    afterOpenedSubject: Subject<any> = new Subject();
    className = 'SliderRef';

    constructor(private currentSlideSubject: Subject<any>,
                private dialogRef: MatDialogRef<any>) {
    }

    /**
     * Go back if can go back, close dialog if can't go back
     * @param data
     * @param {boolean} animation
     */
    close(data?, animation = true) {
        this.currentSlideSubject.next({
            action: 'closeRef',
            ref: this,
            data: data,
            ob: this.afterClosedSubject,
            animation: animation
        });
    }

    /**
     * Close dialog and fire event "afterClosed" for  first dialog
     * @param data
     */
    forceCloseDialog(data?) {
        this.currentSlideSubject.next({
            action: 'forceCloseDialog',
            data: data,
            ob: this.afterClosedSubject
        });
    }

    afterClosed() {
        return this.afterClosedSubject;
    }

    afterOpened() {
        return this.afterOpenedSubject;
    }

    /**
     * Update size of dialog
     * @param {string} width
     * @param {string} height
     */
    updateSize(width?: string, height?: string) {
        this.dialogRef.updateSize(width, height);
    }

    /**
     * Update position of dialog
     * @param {DialogPosition} position
     */
    updatePosition(position?: DialogPosition) {
        this.dialogRef.updatePosition(position);
    }

    /**
     * Get dialogRef
     * @returns {MatDialogRef<any>}
     */
    getDialogRef() {
        return this.dialogRef;
    }
}
