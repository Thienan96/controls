import {Injectable} from '@angular/core';
import {SlideService} from './slide.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogData } from '../../shared/models/common.info';


@Injectable({
    providedIn: 'root'
})
export class SlideDialogService {

    constructor(private slideService: SlideService) {
    }

    open(component: any, config: any, dialogRef: MatDialogRef<any>): any {
        return this.slideService.createSlide(component, <DialogData>config.data, dialogRef);
    }
}
