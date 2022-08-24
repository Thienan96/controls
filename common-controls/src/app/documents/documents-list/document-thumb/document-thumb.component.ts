import { Component, OnInit, OnChanges, SimpleChanges, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { interval } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { Document } from '../../../shared/models/common.info';
import {HelperService} from '../../../core/services/helper.service';

@Component({
  selector: 'ntk-document-thumb',
  templateUrl: './document-thumb.component.html',
  styleUrls: ['./document-thumb.component.css']
})
export class DocumentThumbComponent implements OnInit, OnChanges, OnDestroy {

  private _isDetectingDocumentProcessed = false;
  private _timmerAlive = false;
  @Input('document') _document: Document;
  @Output('documentStatusChanged') _documentStatusChanged = new EventEmitter<Document>();
  constructor(private _helperService: HelperService) { }


  ngOnInit() {
    this.startCheckDocumentProcessed();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!!changes['_document']) {
      if (this._document) {
        this.startCheckDocumentProcessed();
      }
    }
  }

  get isProcessing(): boolean {
    let result = this._document && this._document.Status !== 'Processed';
    return result;
  }

  get isFail(): boolean {
    let result = this._document && this._document.Status === 'ProcessingFailed';
    return result;
  }

  getDocumentThumbUrl() {
    if (this._document && this._document.Status === 'Processed') {
      return this._helperService.DocumentService.buildDocumentThumbUrl(this._document);
    } else {
      return '';
    }
  }

  ngOnDestroy() {
    // console.log('DocumentThumbComponent - ngOnDestroy');
    this._timmerAlive = false;
  }

  startCheckDocumentProcessed() {
    // console.log('startCheckDocumentProcessed: ', this._document);

    if (this._document && this._document.Status === 'Uploaded') {
        // If document's status is in "Uploaded", create timer to dectect status for each 5s
        this._timmerAlive = true;
        interval(5000).pipe(
          takeWhile( () => this._timmerAlive)
        ).subscribe(() => {
          if (this._isDetectingDocumentProcessed) { return; }
          this._isDetectingDocumentProcessed = true;

          this._helperService.DocumentService.getDocumentDetails(this._document.Id).subscribe(data => {
              // console.log('getDocumentDetail: Id= ' + data.Id + ' -> ' + data.Status);
              this._isDetectingDocumentProcessed = false;
              if (data.Status === 'Processed') {
                  this._timmerAlive = false;
                  Object.assign(this._document, data);
                  if (this._documentStatusChanged) {
                    this._documentStatusChanged.emit(this._document);
                  }
              } else if (data.Status === 'ProcessingFailed') {
                  this._document.Status = 'ProcessingFailed';
                  this._timmerAlive = false;
                  if (this._documentStatusChanged) {
                    this._documentStatusChanged.emit(this._document);
                  }
              } else {
                  // status is in "Uploaded"
                  // nothing to do
              }
          }, error => {
              this._timmerAlive = false;
              this._isDetectingDocumentProcessed = false;
          });
        });
    }
  }

}
