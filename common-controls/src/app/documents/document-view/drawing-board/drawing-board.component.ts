import {
  Component, OnInit, AfterContentInit, ElementRef, ViewChild
  , Renderer2, Input, OnChanges, SimpleChanges, EventEmitter, Output, HostListener
} from '@angular/core';
import { CanvasWrapper } from './CanvasWrapper/CanvasWrapper';
import { BaseShape } from './Shapes/BaseShape';

@Component({
  selector: 'ntk-drawing-board',
  templateUrl: './drawing-board.component.html',
  styleUrls: ['./drawing-board.component.css'],
  host: {
    style: 'overflow: hidden;'
  }
})
export class DrawingBoardComponent implements OnInit, AfterContentInit, OnChanges {

  private _options: CanvasOptions;
  private _canvasWrapper: CanvasWrapper;
  @Input() autoResize = false;

  @Input() canDraw: boolean;
  @ViewChild('drawingCanvas', { static: true }) _drawingCanvas: ElementRef;

  @Input() imageUrl: string;
  @Input() drawingShapes: BaseShape[];

  @Input() pageIndex = 0;

  @Output('shapes-changed') shapesChanged = new EventEmitter<{ action: string, items: any[] }>();

  constructor(private _renderer: Renderer2, private elementRef: ElementRef) {
    this._options = {
      zoom: {
        value: 1.0,
        step: 0.1,
        min: 0.05,
        max: 6
      },
      rotate: {
        value: 0,
        step: 90
      },
      controls: {
        fit: 'page',
        disableZoomIn: false,
        disableZoomOut: false,
        disableRotate: false
      },
      info: {
        isLoadedImage: false
      },
      disableZoomIn: false,
      disableZoomOut: false,
      shapesChanged: (action: string, items: any[]) => {
        this.shapesChanged.emit({ action: action, items: items });
      }
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['imageUrl']) {
      this.reloadImage();
    }

    if (changes['drawingShapes']) {
      this.reloadShapes();
    }

    if (changes['canDraw']) {
      this.canDrawChanged();
    }
  }

  onResize() {
  }

  onResized() {
    this._canvasWrapper.resizeCanvas();
  }

  private canDrawChanged() {
    if (this._canvasWrapper) {
      this._canvasWrapper.canDraw = this.canDraw;
    }
  }
  private reloadImage() {
    if (this._canvasWrapper) {
      if (this.imageUrl) {
        this._options.rotate.value = 0;
        this._options.disableZoomOut = false;
        this._options.disableZoomIn = false;
        this._canvasWrapper.readImage(this.imageUrl);
      } else {
        this._canvasWrapper.clearImage();
      }
    }
  }

  zoom(direction: number) {
    if (this._canvasWrapper) {
      this._canvasWrapper.zoom(direction);
    }
  }

  rotate(direction: 'left' | 'right') {
    if (this._canvasWrapper) {
      this._canvasWrapper.rotate(direction === 'left' ? -1 : 1)
    }
  }

  get isLoadingData(): boolean {
    if (this._canvasWrapper) {
      return this._canvasWrapper.isLoadingImage;
    }

    return false;
  }

  private reloadShapes() {    
    if (this._canvasWrapper) {
      this._canvasWrapper.shapes = this.drawingShapes;
      // this._canvasWrapper.applyTransform();
    }
  }

  ngOnInit() {
  }

  ngAfterContentInit(): void {
    this._canvasWrapper = new CanvasWrapper(this._drawingCanvas, this._options, this._renderer);
    this._canvasWrapper.canDraw = this.canDraw;
    this._canvasWrapper.canvasElement.style.cursor = 'pointer';
    this.reloadImage();
    this.reloadShapes();
  }

  // this for test drawing
  public testDrawShapes() {
    this._canvasWrapper.invalidate();
  }

  setCurrentDrawingShape(name: string) {
    if (this._canvasWrapper) {
      switch (name) {
        case 'None':
          this._canvasWrapper.canvasElement.style.cursor = 'pointer';
          this._canvasWrapper.currentDrawingShape = 'None';
          this._canvasWrapper.selectedShape = null;
          this._canvasWrapper.invalidate();
          break;
        case 'Arrow':
        case 'Line':
        case 'PolyLine':
        case 'Rectangle':
        case 'Cloud':
        case 'Ellipse':
          this._canvasWrapper.canvasElement.style.cursor = 'crosshair';
          this._canvasWrapper.currentDrawingShape = name;
          this._canvasWrapper.selectedShape = null;
          this._canvasWrapper.invalidate();
          break;

      }
    }
  }

  deleteSelectedShape() {
    if (this._canvasWrapper) {
      this._canvasWrapper.removeSelectedShape();
    }
  }

  exportAllShapes(): any[] {
    if (this._canvasWrapper) {
      return this._canvasWrapper.exportAllShapes();
    }

    return null;
  }
  get getStateZoom() {
    return this._options.controls;
  }
}

class CanvasOptions {
  zoom: {
    value: number,
    step: number,
    min: number,
    max: number
  };
  rotate: {
    value: number,
    step: number
  };
  controls: {
    fit: string,
    disableZoomIn: boolean,
    disableZoomOut: boolean,
    // disableMove: false,
    disableRotate: boolean
  };
  info: {
    isLoadedImage: boolean
  };

  disableZoomOut: boolean;
  disableZoomIn: boolean;
  shapesChanged: (action: string, items: any[]) => void
}
