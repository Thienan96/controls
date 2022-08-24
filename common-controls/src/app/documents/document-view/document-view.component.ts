import { Component, ElementRef, HostListener, Input, OnInit, Renderer2, ViewChild, Output, EventEmitter, OnChanges, SimpleChange } from '@angular/core';
import { TimerObservable } from 'rxjs/observable/TimerObservable';

import { DrawingBoardComponent } from './drawing-board/drawing-board.component';
import { BaseShape } from './drawing-board/Shapes/BaseShape';
import { RectangleShape } from './drawing-board/Shapes/RectangleShape';
import { EllipseShape } from './drawing-board/Shapes/EllipseShape';
import { LineShape } from './drawing-board/Shapes/LineShape';
import { PolyLineShape } from './drawing-board/Shapes/PolyLineShape';
import { Document, IDocumentWrapper } from '../../shared/models/common.info';


import { AppConfig } from '../../core/app.config';
import { UtilityService } from '../../core/services/utility.service';
import { AuthenticationService } from '../../core/services/authentication.service';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonDocumentService } from '../shared/common-document.service';
import { CloudShape } from './drawing-board/Shapes/CloudShape';
import { ApiService } from '../../core/services/Api.service';
import { E } from '@angular/cdk/keycodes';


@Component({
  selector: 'ntk-document-view',
  templateUrl: './document-view.component.html'
})
export class DocumentViewComponent implements OnInit {

  @Input('canDraw') canDraw: boolean;
  @Input() isShowDownload?;
  @Input() isOffline: boolean;

  @Input('documentWrapper')
  set setDocumentWrapper(value: IDocumentWrapper) {
    this.documentWrapper = value;

    if (this.documentWrapper) {
      this.pageNumber = this.documentWrapper.Document.NbrPages;

      this.pageIndex = 1;
      if (this.documentWrapper.HasDrawing) {
        this.pageIndex = this.documentWrapper.DrawingPageIndex + 1;
        this.currentPage = this.documentWrapper.DrawingPageIndex + 1;
      }

      this.drawingShapes = this.parseJsonToShapes();
    } else {
      this.pageNumber = 1; // 1 not 0 -> because below check !this.pagenumber (support module document)
    }

    if (!this.pageNumber) {
      this.pageNumber = 1;
    }

    this.bindImageSrc(this.pageIndex - 1);
  }

  pageIndex: number = 1;
  pageNumber: number;
  currentPage: number = 1;
  isLoadingData: boolean = false;
  orginalImageHeight = 0; // orginal height of image
  orginalImageWidth = 0; // orginal width of image


  // @ViewChild('imgFullSize')img: ElementRef;
  @ViewChild('drawingBoard', { static: false }) drawingBoard: DrawingBoardComponent;

  private _imageSrc: string;

  public drawingShapes: BaseShape[];

  documentWrapper: IDocumentWrapper;


  constructor(private _documentService: CommonDocumentService,
    private http: HttpClient) {
  }

  ngOnInit() {
    // if (this.img) {
    //     this._renderer.listen(this.img.nativeElement, 'error', (event) => this.onLoadImageFailure(event));
    //     this._renderer.listen(this.img.nativeElement, 'load', (event) => this.onLoadImageSuccess(event));

    //     this.bindImageSrc(0);
    // }
  }

  private buildFullSizeImageUrl(document: Document, index: number): string {
    const fullsizeUrl = this._documentService.buildDocumentUrl(document, index);

    // console.log('buildFullSizeImageUrl = ', fullsizeUrl);

    return fullsizeUrl;

    // original code from incident portal
    // let extension: string = '.' + document.Type.toString();
    // if (document.Type.toString() === 'PDF') {
    //     extension = '_' + index + '.jpg';
    // }

    // let src: string = this._utilityService.addSlashIfNotExists(this._appConfig.API_URL) +
    //     'document' +
    //     '/' + this._authenticateService.currentManagedCompany.Id +
    //     '/' + document.SiteId +
    //     '/' + document.Id + extension;

    // return src;
  }

  private setPage(pindex: number) {
    if (!!pindex && this.currentPage !== pindex && pindex <= this.pageNumber) {
      this.currentPage = pindex;
      this.bindImageSrc(pindex - 1);
    } else {
      this.pageIndex = this.currentPage;
    }

    this.drawingShapes = null;
    this.drawingShapes = this.parseJsonToShapes();
  }

  nextPage() {
    this.pageIndex = this.pageIndex + 1;
    this.setPage(this.pageIndex);
  }

  previousPage() {
    this.pageIndex = this.pageIndex - 1;
    this.setPage(this.pageIndex);
  }

  onPageIndexChange(event: any) {
    // console.log('onPageIndexChange:', event);
    this.setPage(this.pageIndex);
  }

  // @HostListener('window:resize')
  // onResizeWindow() {
  //   TimerObservable.create(200).subscribe(() => {
  //     // for sure we get actual window.height and window.width
  //     this.recomputeImageRatio();
  //   });
  // }

  /**
   * This call on drawing board when there is a change on drawing board
   * @param $event
   */
  onDrawingChanged($event) {
    let shapes = this.drawingBoard.exportAllShapes();
    this.documentWrapper.Shapes = shapes;
    this.documentWrapper.DrawingPageIndex = this.pageIndex - 1;
  }

  get imageUrl(): string {
    return this._imageSrc;
  }

  private bindImageSrc(pageIndex: number) {
    this._imageSrc = null;
    if (!this.documentWrapper || (this.documentWrapper.Document.Status !== 'Processed' && this.documentWrapper.Document.Status !== 'Offline')) {
      this._imageSrc = null;
      return;
    }

    this.isLoadingData = true;
    if (this.documentWrapper.Document.File) {
      this._imageSrc = URL.createObjectURL(this.documentWrapper.Document.File);
      this.isLoadingData = false;
    } else {
      // NBSHD-4041
      const url = this.buildFullSizeImageUrl(this.documentWrapper.Document, pageIndex);
      this.http.get(url, { responseType: 'blob' }).subscribe(x => {
        if (x) {
          this._imageSrc = URL.createObjectURL(x);
        }
        this.isLoadingData = false;
      }, () => {
        this.isLoadingData = false;
      });
    }
    //     .map(val => this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(val)));

    // this._imageSrc = this.buildFullSizeImageUrl(this.documentWrapper.Document, pageIndex);
    // this.img.nativeElement.src = '';
    // this.img.nativeElement.src = this._imageSrc;
    // this.img.nativeElement.style.display = 'None'; // waiting completed download image
  }

  onLoadImageFailure(event: any) {
    // console.info('Load image fail:' + event.target.src);
  }

  // ref : http://stackoverflow.com/questions/3971841/how-to-resize-images-proportionally-keeping-the-aspect-ratio
  recomputeImageRatio() {
    // tslint:disable-next-line: no-console
    // console.info('--> recomputeImageRatio: ' + window.innerWidth + ' x ' + window.innerHeight + ' ---- ' + this._elementRef.nativeElement.clientWidth + ' x ' + this._elementRef.nativeElement.clientHeight);
    // let maxWidth = this._elementRef.nativeElement.clientWidth; // Max width for the image
    // let maxHeight = this._elementRef.nativeElement.clientHeight - 32 - 8; // Max height for the image (-32 is total height toolbar top and -8 bottom of popup)

    // let ratio = 0;  // Used for aspect ratio
    // let width = this.orginalImageWidth;    // Current image width
    // let height = this.orginalImageHeight;  // Current image height
    // // set orignal width and height of image for window resize
    // //this.img.nativeElement.width = width;
    // //this.img.nativeElement.height = height;
    // // Check if the current width is larger than the max
    // if (width > maxWidth) {
    //   ratio = maxWidth / width;   // get ratio for scaling image
    //   //  this.img.nativeElement.width = maxWidth;
    //   //  this.img.nativeElement.height = height * ratio;
    //   height = height * ratio;    // Reset height to match scaled image
    //   width = width * ratio;    // Reset width to match scaled image
    // }

    // // Check if current height is larger than max
    // if (height > maxHeight) {
    //   ratio = maxHeight / height; // get ratio for scaling image
    //   //this.img.nativeElement.height = maxHeight;
    //   //this.img.nativeElement.width = width * ratio;
    //   width = width * ratio;    // Reset width to match scaled image
    //   height = height * ratio;    // Reset height to match scaled image
    // }

    // height and width of drawing is the same height/width of image
    // this.divDrawing.nativeElement.style.width = this.img.nativeElement.width + 'px'; // set height of div drawing SVG
    // this.divDrawing.nativeElement.style.height = this.img.nativeElement.height + 'px'; // set widht of div drawing SVG
    // height and width of div contain image is the same height/width of image
    // this.divImage.nativeElement.style.width = this.img.nativeElement.width + 'px';
    // this.divImage.nativeElement.style.height = this.img.nativeElement.height + 'px';
  }

  // onLoadImageSuccess(event: any) {
  //     event.target.style.display = ''; // show image

  //     if (this._imageSrc === event.target.src) {
  //         // Use the HTML5 naturalWidth and naturalHeight
  //         // ref: http://www.tutorialrepublic.com/faq/how-to-get-original-image-size-in-javascript.php
  //         // keep orginal dimension image
  //         //this.orginalImageHeight = this.img.nativeElement.naturalHeight;
  //         //this.orginalImageWidth = this.img.nativeElement.naturalWidth;
  //         this.recomputeImageRatio();
  //     }
  // }

  onRotateLeft() {
    if (this.drawingBoard) {
      this.drawingBoard.rotate('left');
    }
  }

  onRotateRight() {
    if (this.drawingBoard) {
      this.drawingBoard.rotate('right');
    }
  }

  onZoomOut() {
    if (this.drawingBoard) {
      this.drawingBoard.zoom(-1);
    }
  }

  onZoomIn() {
    if (this.drawingBoard) {
      this.drawingBoard.zoom(1);
    }
  }

  downloadImage() {
    if (!this.documentWrapper) {
      return;
    }
    // let saveAs: string = this.documentWrapper.Document.Name + '.' + this.documentWrapper.Document.Type;
    // this._docSvc.processDownloadFile(this.documentWrapper.Id, saveAs, 'Document');
    // this._documentService.onDownloadDocument.emit(this.documentWrapper);
    let saveAs: string = this.documentWrapper.Document.Name + '.' + this.documentWrapper.Document.Type;
    this._documentService.downloadDocument(this.documentWrapper.Document.Id, saveAs);
  }

  parseJsonToShapes(): BaseShape[] {
    /// console.log('parseJsonToShapes:', this.documentWrapper);
    /// console.log('this.currentPage:', this.currentPage);

    let shapes = [];
    if (this.documentWrapper.Shapes && this.documentWrapper.DrawingPageIndex === this.currentPage - 1) {

      let jsonShapes = this.documentWrapper.Shapes;
      for (let i = 0; i < jsonShapes.length; i++) {
        let noteShape = jsonShapes[i];
        //var color = hexToRgb(noteShape.Color);
        let shapeName = noteShape.Type;
        switch (shapeName) {
          case 'Rectangle': {
            shapes.push(new RectangleShape(
              (noteShape.Points[0].X),
              (noteShape.Points[0].Y),
              (noteShape.Points[1].X),
              (noteShape.Points[1].Y),
              noteShape.Color,
              (noteShape.Thickness),
              'Rectangle',
              noteShape.Name));
          } break;
          case 'Cloud':
            shapes.push(new CloudShape(
              (noteShape.Points[0].X),
              (noteShape.Points[0].Y),
              (noteShape.Points[1].X),
              (noteShape.Points[1].Y),
              noteShape.Color,
              (noteShape.Thickness),
              noteShape.Name));
            break;
          case 'Ellipse':
            shapes.push(new EllipseShape(
              (noteShape.Points[0].X),
              (noteShape.Points[0].Y),
              (noteShape.Points[1].X),
              (noteShape.Points[1].Y),
              noteShape.Color,
              (noteShape.Thickness),
              noteShape.Name));
            break;
          // case 'Pin':
          //     this.addShape(new PinShape(noteShape.Points[0].X, noteShape.Points[0].Y, noteShape.Name));
          //     break;
          case 'Line':
            let shapName = 'Line';
            if (noteShape.ArrowType !== 'None') {
              shapeName = 'Arrow';
            }

            shapes.push(new LineShape(
              noteShape.Points[0].X,
              noteShape.Points[0].Y,
              noteShape.Points[1].X,
              noteShape.Points[1].Y,
              shapeName,
              noteShape.Color,
              noteShape.Thickness,
              noteShape.Name));

            break;
          case 'Polyline':
            if (noteShape.Points) {
              let points = [];
              for (let j = 0; j < noteShape.Points.length; j++) {
                let point = noteShape.Points[j];
                points.push({ x: point.X, y: point.Y });
              }
              shapes.push(new PolyLineShape(
                points,
                noteShape.Color,
                noteShape.Thickness,
                noteShape.Name));

            }
            break;
          // case 'Text':
          //     this.addShape(new TextShape(
          //         parseFloat(noteShape.Points[0].X),
          //         parseFloat(noteShape.Points[0].Y),
          //         noteShape.Text,
          //         noteShape.Color,
          //         parseFloat(noteShape.Thickness),
          //         noteShape.Name));
          //     break;
        }
      }
    }
    return shapes;
  }

  onDeleteSelectedClick() {
    if (this.drawingBoard) {
      this.drawingBoard.deleteSelectedShape();
    }
  }

  onDrawingShapeChanged($event) {
    if (this.drawingBoard) {
      this.drawingBoard.setCurrentDrawingShape($event.value);
    }
  }

  saveCurrentDrawing() {
    if (this.drawingBoard) {
      if (this.documentWrapper.Shapes === null || this.documentWrapper.Shapes.length === 0) {
        this.documentWrapper.HasDrawing = false;
      } else {
        this.documentWrapper.HasDrawing = true;
      }
    }
  }
}
