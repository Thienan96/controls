import { Component, Input, Injector, SimpleChanges, Output, EventEmitter, OnChanges } from '@angular/core';
import { PdfPreviewService } from './shared/pdf-preview.service';
import { IDocumentWrapper, Document } from '../shared/models/common.info';
import { AppConfig, UtilityService } from '../shared/common-controls-shared.module';
import {CommonDocumentService} from '../documents/shared/common-document.service';


@Component({
  selector: 'ntk-pdf-preview',
  templateUrl: './pdf-preview.component.html',
  styleUrls: ['./pdf-preview.component.scss']
})
export class PdfPreviewComponent implements OnChanges {
  @Input() canDownloadFile = true;

  @Input() canShowFullReport = true;

  @Input() demo: boolean;

  // @Input() pdfSrc: string;

  @Input() isShowFullReport = false;

  @Input() documentWrapper: IDocumentWrapper;

  @Input('isGeneratingReport')
  set isGeneratingReport(value: boolean) {
    this._isGeneratingReport = value;
    if (this._isGeneratingReport) { this.isLoadingPdf = true; }
  }

  @Output() onDownloadDocument: EventEmitter<any> = new EventEmitter();

  @Output() onShowFullRequest: EventEmitter<any> = new EventEmitter();

  pdfObj: any;
  zoomLevel = 1;
  isLoadingPdf = true;
  private _isGeneratingReport = false;

  // tslint:disable-next-line: adjacent-overload-signatures
  get isGeneratingReport(): boolean {
    return this._isGeneratingReport;
  }

  constructor(
    private _documentService: CommonDocumentService,
    private _appConfig: AppConfig,
    private _util: UtilityService,
    private _pdfPreviewSerVice: PdfPreviewService)  {
    }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentWrapper']) {
      this.zoomLevel = 1;
      this.generateSrcObject();
    }
  }

  expandPreview() {
    this.isShowFullReport = !this.isShowFullReport;
    if (this.onShowFullRequest) { this.onShowFullRequest.emit(this.isShowFullReport); }
  }

  zoomIn() {
    this.zoomLevel += 0.1;
  }

  zoomOut() {
    this.zoomLevel -= 0.1;
  }

  afterPdfLoaded(event) {
    // console.log(event);
  }

  pageRendered(event) {
    // console.log(event);
  }

  downloadPdfFile() {
    let saveAs: string = this.documentWrapper.Document.Name + '.' + this.documentWrapper.Document.Type;
    this._documentService.downloadDocument(this.documentWrapper.Document.Id, saveAs);
  }

  onLoadingProgress(event: {loaded: number, total: number}) {
    this.isLoadingPdf = true;
    if (event.total) {
        this.isLoadingPdf = false;
    }
  }

  private generateSrcObject() {
    if (!this.documentWrapper) {
      this.documentWrapper = undefined;
      return;
    }

    let clientId: string;

    clientId = this._pdfPreviewSerVice.getClientId();

    let sessionId = this._pdfPreviewSerVice.getSessionId();

    let headers = {};

    if (clientId) {
      headers['ClientId'] = clientId;
    }

    if (sessionId) {
      headers['Authorization'] = 'Token ' + sessionId;
    }

    let srcObj = {};
    srcObj['url'] = this.buildDocumentUrl(this.documentWrapper.Document);
    srcObj['httpHeaders'] = headers;
    this.pdfObj = srcObj;
  }

  // get full document url
  buildDocumentUrl(document: Document) {
    if (!document) {
      return '';
    }

    let url = this._util.addSlashIfNotExists(this._appConfig.API_URL) + `${document.DocumentUrl}.${document.Type}`;
    return url;
  }
}
