import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import { AddCommentComponent } from './add-comment.component';
import { MatButtonModule, MatIconModule } from '@angular/material';
import { MentionModule } from 'angular-mentions';
import { FormsModule } from '@angular/forms';
import { AttachmentBoxModule } from '../../documents/attachment-box/attachment-box.module';
import { TextFieldModule } from '@angular/cdk/text-field';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
    declarations: [
        AddCommentComponent
    ],
    imports: [
        CommonModule,
        MatIconModule,
        FormsModule,
        TextFieldModule,
        MentionModule,
        AttachmentBoxModule,
        FlexLayoutModule,
        MatButtonModule
    ],
    exports: [
        AddCommentComponent
    ],
    entryComponents: [
    ],
    providers: []
})
export class AddCommentModule {
}
