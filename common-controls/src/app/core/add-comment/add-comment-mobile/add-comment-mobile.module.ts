import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { AddCommentMobileComponent } from './add-comment-mobile.component';
import { MatButtonModule, MatIconModule, MatInputModule } from '@angular/material';
import { MentionModule } from 'angular-mentions';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AttachmentBoxMobileModule } from '../../../documents/attachment-box-mobile/attachment-box-mobile.module';

@NgModule({
    declarations: [
        AddCommentMobileComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        MentionModule,
        TextFieldModule,
        FormsModule,
        AttachmentBoxMobileModule,
        FlexLayoutModule,
        MatButtonModule,
        MatInputModule
    ],
    exports: [
        AddCommentMobileComponent
    ],
    entryComponents: [
        AddCommentMobileComponent
    ],
    providers: []
})
export class AddCommentMobileModule {
}
