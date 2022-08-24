import { Injector, Inject, Component, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { DocumentsListComponent } from '../documents-list/documents-list.component';
import { BaseDialog } from '../../core/dialogs/base.dialog';
import { DialogData, Document, IDocumentWrapper } from '../../shared/models/common.info';
import { CommonDocumentService } from '../shared/common-document.service';

@Component({
    selector: 'ntk-attach-document-dialog',
    templateUrl: './attach-documents.dialog.html',
    styleUrls: ['./attach-documents.dialog.scss']
})
export class AttachDocumentsDialog extends BaseDialog {

    @ViewChild('inputQuery', {static: false}) inputQuery: ElementRef;

    @ViewChild('documentsList', {static: false}) _documentsList: DocumentsListComponent;
    isShowSearch: boolean;
    isShowDownload = true;
    siteId?: string;
    isShowFullPDFDocument: boolean;
    isShowPDFDocument: boolean;

    // mean that this site is with rooms or not, it impact select rooms when add new folder
    withRooms: boolean;
    query: string;

    selectedDocument: IDocumentWrapper;

    private _docService: CommonDocumentService;
    constructor(injector: Injector, private dialogRef: MatDialogRef<AttachDocumentsDialog>
        , @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
            super(injector, dialogRef, dialogData);
            this._docService = injector.get(CommonDocumentService);

            if (dialogData.Data) {
                this.siteId = <string> dialogData.Data.siteId;
                this.withRooms = <boolean> dialogData.Data.withRooms;
            }
    }

    onShowFullPreview($event) {
        this.isShowFullPDFDocument = $event;
      }

    searchTextChanged($event) {
        console.log('searchTextChanged: ', $event);

        if (this._documentsList) {
            this._documentsList.refreshDocuments($event);
        }
    }

    enableSearch() {
        this.isShowSearch = true;

        if (!this._util.isDevice) {
            TimerObservable.create(200).subscribe(() => this.inputQuery.nativeElement.focus());
        }
    }

    disableSearch() {
        this.isShowSearch = false;

        if (this._documentsList) {
            this._documentsList.refreshDocuments('');
        }
    }

    clearQuery() {
        this.query = '';
    }

    onDocumentSelected($event: Document) {
        this.selectedDocument = null;
        // to allow refresh
        if ($event) {
            setTimeout(() => {
                this.selectedDocument = {
                    Id: $event.Id,
                    EntityVersion: 0,
                    Document: $event
                };
              }, 100);
            if ($event.Type.toUpperCase() === 'PDF') {
                this.isShowPDFDocument = true;
            } else {
                this.isShowPDFDocument = false;
            }
        } else {
            this.selectedDocument = null;
        }
    }
    acceptSelectionClick() {
        if (this._documentsList) {
            this._documentsList.getCheckedDocuments().subscribe( selected => {
                this.close(selected);
            });
        }
    }
}
