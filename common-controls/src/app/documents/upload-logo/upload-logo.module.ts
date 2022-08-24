import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { UploadLogoComponent } from './upload-logo.component';
import { NgxFileDropModule } from 'ngx-file-drop';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ImageThumbModule } from '../image-thumb/image-thumb.module';
import { CommonControlsSharedModule } from '../../shared/common-controls-shared.module';
import { MatButtonModule } from '@angular/material';
import { FormsModule } from '@angular/forms';


@NgModule({
    declarations: [
        UploadLogoComponent
    ],
    imports: [
        CommonModule,
        NgxFileDropModule,
        FlexLayoutModule,
        ImageThumbModule,
        CommonControlsSharedModule,
        MatButtonModule,
        FormsModule
    ],
    exports: [
        UploadLogoComponent
    ],
    entryComponents: [
    ],
    providers: []
})
export class UploadLogoModule {
}
