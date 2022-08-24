import { Component, Inject, Injector } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogData } from '../../../shared/common-controls-shared.module';
import { BaseDialog } from '../base.dialog';

@Component({
    selector: 'ntk-select-mail-template-dialog',
    templateUrl: './select-mail-template.dialog.html'
})

export class SelectMailTemplateDialog extends BaseDialog {

    mailTemplates: any[] = [];
    selectedTemplate: any | null = null;
    canSave: boolean = false;
    intervenerMailTemplates: any[] = [];
    requesterMailTemplates: any[] = [];

    onTemplateClick(template: any) {
        if (template.IsDisabled) return;
        this.selectedTemplate = template;
        this.canSave = this.selectedTemplate !== null && this.selectedTemplate !== undefined;
    }

    onTemplateDblClick(template: any) {
        if (template.IsDisabled) return;
        this.selectedTemplate = template;
        this.dialogRef.close(this.selectedTemplate);
    }

    constructor(injector: Injector,
        private dialogRef: MatDialogRef<SelectMailTemplateDialog>,
        @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
        super(injector, dialogRef, dialogData);

        this.mailTemplates = <any[]>dialogData.Data.MailTemplates;
        this.intervenerMailTemplates = <any[]>dialogData.Data.IntervenerMailTemplates;
        this.requesterMailTemplates = <any[]>dialogData.Data.RequesterMailTemplates;
    }

    close() {
        this.dialogRef.close();
    }

    onOk() {
        if (this.selectedTemplate) {
            this.dialogRef.close(this.selectedTemplate);
        }
    }
}
