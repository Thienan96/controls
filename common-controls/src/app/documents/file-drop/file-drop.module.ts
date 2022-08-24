import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { NgxFileDropModule } from 'ngx-file-drop';
import { FlexLayoutModule } from '@angular/flex-layout';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { FileDropComponent } from './file-drop.component';
import { MatIconModule } from '@angular/material';


@NgModule({
    declarations: [
        FileDropComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatIconModule,
        CommonControlsSharedModule,
        NgxFileDropModule
    ],
    exports: [
        FileDropComponent
    ],
    entryComponents: [
        
    ],
    providers: []
})
export class FileDropModule {
}
