import { ElementRef, Renderer2 } from '@angular/core';
import { FormatReader, ImageReader } from './FormatReader';
import { BaseShape } from '../Shapes/BaseShape';
import { RectangleShape } from '../Shapes/RectangleShape';
import { EllipseShape } from '../Shapes/EllipseShape';
import { PolyLineShape } from '../Shapes/PolyLineShape';
import { LineShape } from '../Shapes/LineShape';
import { interval } from 'rxjs';
import { CloudShape } from '../Shapes/CloudShape';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

export class CanvasWrapper {

    private curPos: { x: number, y: number };
    private picPos: { x: number, y: number };

    private reader: ImageReader;
    private imageReader: FormatReader;

    private isDrag = false;
    private isResizeDrag = false;
    private isMove = false;

    currentDrawingShape = 'None';
    selectedShape: BaseShape | null = null;

    shapes: BaseShape[];
    centerX = 0;
    centerY = 0;
    isReadyRenderCenter = false;

    // force correct canvas size
    private canvasSize: any;
    private canvasContext: CanvasRenderingContext2D;

    private resize: { height: number, width: number };

    stylePaddingLeft = 0;
    stylePaddingTop = 0;
    styleBorderLeft = 0;
    styleBorderTop = 0;
    canvasValid: boolean;
    canDraw: any;

    private INTERVAL = 20;  // how often, in milliseconds, we check to see if a redraw is needed
    canvasElement: any;

    isLoadingImage = false;

    private isPinchScaling = false;
    private lastPinchDistance = 0;
    private isTapedTwice = false;

    private initZoom = 0; // in case double tap need to zoom to much we recover into init level

    constructor(private _canvasEl: ElementRef, private _options: any, private _renderer: Renderer2) {


        _renderer.listen(_canvasEl.nativeElement, 'contextmenu', (event) => {
            event.preventDefault();
            return false;
        });

        this.canvasElement = _canvasEl.nativeElement;
        this.canvasContext = _canvasEl.nativeElement.getContext('2d');

        this.canvasSize = _canvasEl.nativeElement.parentNode;
        this.canvasContext.canvas.width = this.canvasSize.clientWidth;
        this.canvasContext.canvas.height = this.canvasSize.clientHeight;

        this.curPos = { x: 0, y: 0 };
        this.picPos = { x: 0, y: 0 };
        this.reader = null; // information photo
        this.imageReader = new FormatReader(_renderer);

        this.resize = { height: this.canvasSize.clientHeight, width: this.canvasSize.clientWidth };

        // fixes mouse co-ordinate problems when there's a border or padding
        // see getMouse for more detail
        if (document.defaultView && document.defaultView.getComputedStyle) {
            this.stylePaddingLeft = parseInt(document.defaultView.getComputedStyle(_canvasEl.nativeElement, null)['paddingLeft'], 10) || 0;
            this.stylePaddingTop = parseInt(document.defaultView.getComputedStyle(_canvasEl.nativeElement, null)['paddingTop'], 10) || 0;
            this.styleBorderLeft = parseInt(document.defaultView.getComputedStyle(_canvasEl.nativeElement, null)['borderLeftWidth'], 10) || 0;
            this.styleBorderTop = parseInt(document.defaultView.getComputedStyle(_canvasEl.nativeElement, null)['borderTopWidth'], 10) || 0;
        }

        this.bindingEvent();
    }

    private bindingEvent() {
        this._renderer.listen(this._canvasEl.nativeElement, 'mousemove', ($event) => {
            // console.log('mousemove: ', $event);
            this.onMove($event);
        });

        this._renderer.listen(this._canvasEl.nativeElement, 'mousedown', ($event) => {
            this.onMoveDown($event);
        });

        // mobile
        this._renderer.listen(this._canvasEl.nativeElement, 'touchstart', ($event) => {

            let rect = $event.target.getBoundingClientRect();
            // console.log('rect ', rect);
            let $$event = {
                offsetX: $event.targetTouches[0].pageX - rect.left,
                offsetY: $event.targetTouches[0].pageY - rect.top,
                clientX: $event.targetTouches[0].clientX,
                clientY: $event.targetTouches[0].clientY,
                target: $event.target
            };

            if ($event.touches.length === 1) {
                if (!this.isTapedTwice) {
                    this.isTapedTwice = true;
                    setTimeout(() => {
                        this.isTapedTwice = false;
                    }, 300);
                } else {
                    $event.preventDefault();
                    this.doubleTaps($event);
                    return;
                }
            }

            if ($event.touches.length === 2) {
                this.isPinchScaling = true;
                this.pinchStart($event);
            }
            else if ($event.ctrlKey) { // test on web for pinch to zoom              

                // ctrl + touch = zoon in
                // ctrl + shift + touch = zoon out

                let touche2 = { pageX: $event.touches[0].pageX, pageY: $event.touches[0].pageY + ($event.shiftKey ? 20 : 10) };
                let $$$event = {
                    touches: [
                        { pageX: $event.touches[0].pageX, pageY: $event.touches[0].pageY },
                        touche2
                    ],
                    target: $event.target
                }
                this.isPinchScaling = true;
                this.pinchStart($$$event);

                touche2.pageY = $event.touches[0].pageY + ($event.shiftKey ? 16 : 12);
                this.pinchMove($$$event);
                return;
            }

            //  console.log('onMoveDown ', $$event);            
            $event.preventDefault();
            this.onMoveDown($$event);
        });
        this._renderer.listen(this._canvasEl.nativeElement, 'touchmove', ($event) => {
            let rect = $event.target.getBoundingClientRect();
            let $$event = {
                offsetX: $event.targetTouches[0].pageX - rect.left,
                offsetY: $event.targetTouches[0].pageY - rect.top,
                clientX: $event.targetTouches[0].clientX,
                clientY: $event.targetTouches[0].clientY
            };

            if (this.isPinchScaling && $event.touches.length === 2) {
                this.pinchMove($event);
            } else {
                this.onMove($$event);
                // this.onMoveDown($$event);
            }
        });

        this._renderer.listen(this._canvasEl.nativeElement, 'touchend', ($event) => {
            if (!$event.ctrlKey) {
                this.isPinchScaling = false;
            }

            let rect = $event.target.getBoundingClientRect();
            let $$event = {
                offsetX: $event.changedTouches[0].pageX - rect.left,
                offsetY: $event.changedTouches[0].pageY - rect.top,
                clientX: $event.changedTouches[0].clientX,
                clientY: $event.changedTouches[0].clientY,
                target: $event.target
            };

            this.mouseUpOut($$event);
        });

        this._renderer.listen(this._canvasEl.nativeElement, 'touchcancel', ($event) => {
            this.mouseUpOut($event);
        });
        //

        this._renderer.listen(this._canvasEl.nativeElement, 'mouseup', ($event) => {
            this.mouseUpOut($event);
        });

        this._renderer.listen(this._canvasEl.nativeElement, 'mouseout', ($event) => {
            this.mouseUpOut($event);
        });

        this._renderer.listen(this._canvasEl.nativeElement, 'DOMMouseScroll', ($event) => {
            this.onMousewheel($event);
        });

        this._renderer.listen(this._canvasEl.nativeElement, 'mousewheel', ($event) => {
            this.onMousewheel($event);
        });

        this._renderer.listen(this._canvasEl.nativeElement, 'onmousewheel', ($event) => {
            this.onMousewheel($event);
        });

        //setInterval(() => this.rerender(), this.INTERVAL);

        let delay = interval(this.INTERVAL);
        delay.subscribe(() => {
            this.rerender();
        });
    }

    doubleTaps($event) {
        if (this._options.controls.disableZoomIn) {
            this._options.zoom.value = this.initZoom;
            this.resizeCanvas();
        } else {
            let oldWidth = this.reader.width * this._options.zoom.value;
            let oldHeight = this.reader.height * this._options.zoom.value;

            let rect = $event.target.getBoundingClientRect();

            let testingZoomValue = this._options.zoom.value;
            // Compute new zoom by increse 1 step
            testingZoomValue += this._options.zoom.step;
            // Round
            testingZoomValue = Math.round(testingZoomValue * 100) / 100;

            // Compute new zoom
            // No stretch and no less
            if (testingZoomValue > 1) {
                this._options.zoom.value = 1;
            } else {
                this._options.zoom.value += this._options.zoom.step * 1;
            }

            let viewPointX = $event.touches[0].pageX - rect.left;
            let viewPointY = $event.touches[0].pageY - rect.top;

            let viewPointToLeft = viewPointX - this.picPos.x;
            let viewPointToTop = viewPointY - this.picPos.y;

            let newWidth = this.reader.width * this._options.zoom.value;
            let newHeight = this.reader.height * this._options.zoom.value;

            let scaleX = newWidth / oldWidth;
            let scaleY = newHeight / oldHeight;


            this.picPos.x = viewPointX - (viewPointToLeft * scaleX);
            this.picPos.y = viewPointY - (viewPointToTop * scaleY);

            this._options.controls.disableZoomOut = this._options.zoom.value <= this.initZoom;//newWidth < this._canvasEl.nativeElement.width && newHeight < this._canvasEl.nativeElement.height;
            this._options.controls.disableZoomIn = this._options.zoom.value >= 1;

            this.applyTransform();
        }
    }
    pinchStart($event) {
        this.lastPinchDistance = Math.hypot(
            $event.touches[0].pageX - $event.touches[1].pageX,
            $event.touches[0].pageY - $event.touches[1].pageY);
    }

    pinchMove($event) {

        let dis = Math.hypot(
            $event.touches[0].pageX - $event.touches[1].pageX,
            $event.touches[0].pageY - $event.touches[1].pageY);

        let dis1 = this.lastPinchDistance;

        let zoomRatio = (dis - dis1) / 200;

        if (zoomRatio > 0 && this._options.controls.disableZoomIn) { return; }
        if (zoomRatio < 0 && this._options.controls.disableZoomOut) { return; }

        // console.log('dis 1  ', dis1);
        // console.log('dis 2  ', dis);

        let rect = $event.target.getBoundingClientRect();

        let oldWidth = this.reader.width * this._options.zoom.value;
        let oldHeight = this.reader.height * this._options.zoom.value;

        let x1 = Math.min($event.touches[0].pageX, $event.touches[1].pageX) - rect.left;
        let y1 = Math.min($event.touches[0].pageY, $event.touches[1].pageY) - rect.top;

        let x2 = Math.max($event.touches[0].pageX, $event.touches[1].pageX) - rect.left;
        let y2 = Math.max($event.touches[0].pageY, $event.touches[1].pageY) - rect.top;


        let viewPointX = x1 + ((x2 - x1) / 2);
        let viewPointY = y1 + ((y2 - y1) / 2);

        let viewPointToLeft = viewPointX - this.picPos.x;
        let viewPointToTop = viewPointY - this.picPos.y;

        // let zoomRatio = (dis - dis1) / Math.max(1, dis1);
        // let testZoom = this._options.zoom.value + (zoomRatio / 10) ;


        // console.log('zoomRatio ', zoomRatio);        
        let testZoom = this._options.zoom.value + zoomRatio;
        testZoom = Math.round(testZoom * 100) / 100;

        // Compute new zoom
        // No stretch and no less
        if (testZoom > 1) {
            this._options.zoom.value = 1;
        } else {
            if (testZoom < this.initZoom) {
                this._options.zoom.value = this.initZoom;
            } else {
                this._options.zoom.value = testZoom;
            }
        }

        this.lastPinchDistance = dis;

        let newWidth = this.reader.width * this._options.zoom.value;
        let newHeight = this.reader.height * this._options.zoom.value;


        let scaleX = newWidth / oldWidth;
        let scaleY = newHeight / oldHeight;


        this.picPos.x = viewPointX - (viewPointToLeft * scaleX);
        this.picPos.y = viewPointY - (viewPointToTop * scaleY);



        this._options.controls.disableZoomOut = this._options.zoom.value <= this.initZoom; // this._canvasEl.nativeElement.width && newHeight < this._canvasEl.nativeElement.height;
        this._options.controls.disableZoomIn = this._options.zoom.value >= 1;

        this.applyTransform();
    }

    private onMove($event) {
        let mousePosition = this.getMouse($event);
        let v = this.getRatio();

        switch (this.currentDrawingShape) {
            case 'Cloud':
            case 'Rectangle':
            case 'Ellipse':
            case 'PolyLine':
            case 'Line':
            case 'Arrow':
                if (this.selectedShape) {
                    this.selectedShape.drawing(mousePosition.mx, mousePosition.my, this);
                    this.invalidate();
                }
                break;
            case 'None':
                if (this.isMove && !this.isResizeDrag && !this.isDrag) {
                    if (this.reader !== null) { // drag picture
                        let coordX = $event.offsetX;
                        let coordY = $event.offsetY;
                        let translateX = coordX - this.curPos.x;
                        let translateY = coordY - this.curPos.y;

                        this.picPos.x += translateX;
                        this.picPos.y += translateY;
                        this.applyTransform();
                        this.curPos.x = coordX;
                        this.curPos.y = coordY;
                    }
                } else {
                    if (!this.isMove) {// drag a shape
                        this.draggingShape($event);
                    }
                }
                break;
        }
    }

    private onMoveDown($event) {
        let mousePosition = this.getMouse($event);
        let v = this.getRatio();

        let m = this.getMouseCoordRender(mousePosition.mx, mousePosition.my);
        let mxv = m.x;
        let myv = m.y;

        // if (this.currentDrawingShape !== 'None' && this.drawingPageIndex !== this.currentPageIndex) {
        //     this.drawingPageIndex = this.currentPageIndex;
        //     this.shapes = [];
        //     this.invalidate();
        // }
        let width = 2;
        let height = 2;
        switch (this.currentDrawingShape) {
            case 'Rectangle':
                this.selectedShape = new RectangleShape(mxv, myv, width, height, '#FF0000', 3);
                this.addShape(this.selectedShape);
                break;
            case 'Ellipse':
                this.selectedShape = new EllipseShape(mxv, myv, width, height, '#FF0000', 3);
                this.addShape(this.selectedShape);
                break;
            case 'Cloud':
                this.selectedShape = new CloudShape(mxv, myv, width, height, '#FF0000', 3);
                this.addShape(this.selectedShape);
                break;
            case 'PolyLine':
                let points = [];
                points.push({ x: mxv, y: myv });
                this.selectedShape = new PolyLineShape(points, '#FF0000', 3);
                this.addShape(this.selectedShape);
                break;
            case 'Line':
            case 'Arrow':
                this.selectedShape = new LineShape(mxv, myv, mxv + 4, myv + 4, this.currentDrawingShape, '#FF0000', 3);
                this.addShape(this.selectedShape);
                break;
            case 'None':
                this.hitShape($event);
                this.isMove = !this.isResizeDrag && !this.isDrag;
                if (this.isMove) {
                    // console.trace('set curPos');

                    this.curPos.x = $event.offsetX;
                    this.curPos.y = $event.offsetY;
                }
        }
    }

    private onMousewheel($event) {
        // cross-browser wheel delta
        let event = window.event || $event; // old IE support
        let delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

        // console.log('wheel delta:', delta);

        if (delta > 0) {
            // that.scope.zoom(1);
            this.zoom(1);
        } else {
            // that.scope.zoom(-1);
            this.zoom(-1);
        }

        // for IE
        event.returnValue = false;
        // for Chrome and Firefox
        if (event.preventDefault) {
            event.preventDefault();
        }
    }

    addShape(shape: BaseShape) {
        this.shapes.push(shape);
        this.invalidate();

        if (this._options.shapesChanged) {
            this._options.shapesChanged('add', [shape]);
        }
    }

    rerender() {
        if (this.canvasValid === false) {
            this.applyTransform();
            this.canvasValid = true;
        }
    }

    hitShape($event) {
        if (!this.canDraw || this.isPinchScaling) { return };

        let l = this.shapes.length;
        let found = false;
        let mousePos = this.getMouse($event);
        let v = this.getRatio();
        for (let i = l - 1; i >= 0; i--) {
            found = this.shapes[i].contains(mousePos.mx, mousePos.my, this);
            if (found) {
                this.isDrag = true;
                this.selectedShape = this.shapes[i];
                this.selectedShape.prepareDrag(mousePos.mx, mousePos.my, this);
                this.invalidate();
                return;
            }
        }

        // havent returned means we have selected nothing
        this.selectedShape = null;
        // invalidate because we might need the selection border to disappear
        this.invalidate();
    }

    getRatio(): number {
        return this._options.zoom.value;
    }

    getMouse(e): { mx: number, my: number } {
        let element = this._canvasEl.nativeElement, offsetX = 0, offsetY = 0;

        let x, y;
        x = e.offsetX || e.clientX;
        y = e.offsetY || e.clientY;

        // Add padding and border style widths to offset
        offsetX += this.stylePaddingLeft;
        offsetY += this.stylePaddingTop;

        offsetX += this.styleBorderLeft;
        offsetY += this.styleBorderTop;

        let mouseX = x - offsetX;
        let mouseY = y - offsetY

        return {
            mx: mouseX, my: mouseY
        }
    }

    getMouseCoordRender(mx: number, my: number): { x: number, y: number } {
        let radians = (Math.PI / 180) * this._options.rotate.value;
        let cos = Math.cos(radians);
        let sin = Math.sin(radians);
        let v = this.getRatio();
        let cx = this.centerX;
        let cy = this.centerY;
        let nx = (cos * (mx - cx)) + (sin * (my - cy)) + cx;
        let ny = (cos * (my - cy)) - (sin * (mx - cx)) + cy;
        let mxv = 0;
        let myv = 0;
        switch (this._options.rotate.value) {
            case -270:
            case 90:
                mxv = (nx - this.picPos.y) / v;
                myv = (ny + this.picPos.x) / v;
                return { x: mxv, y: myv };
                break;
            case -180:
            case 180:
                mxv = (nx + this.picPos.x) / v;
                myv = (ny + this.picPos.y) / v;
                return { x: mxv, y: myv };
                break;
            case -90:
            case 270:
                mxv = (nx + this.picPos.y) / v;
                myv = (ny - this.picPos.x) / v;
                return { x: mxv, y: myv };
                break;
            default:
                mxv = (mx - this.picPos.x) / v;
                myv = (my - this.picPos.y) / v;
                return { x: mxv, y: myv };
        }
    }

    mouseUpOut($event) {
        if (this.currentDrawingShape !== 'None') {
            // that.currentDrawingShape = 'None';
            let mousePosition = this.getMouse($event);
            let mrender = this.getMouseCoordRender(mousePosition.mx, mousePosition.my);
            if (this.selectedShape) {
                this.selectedShape.endDrawing(mrender.x, mrender.y);
                if (this._options.shapesChanged) {
                    this._options.shapesChanged('change', [this.selectedShape]);
                }
            }

            this.invalidate();
            this.selectedShape = null;
            // that.canvasElement.style.cursor = 'auto';
        }

        if (this.isDrag) {
            if (this.selectedShape && this._options.shapesChanged) {
                this._options.shapesChanged('move', [this.selectedShape]);
            }
        }

        this.isMove = false;
        this.isDrag = false;
        this.isResizeDrag = false;
    }
    applyTransform() {
        if (this.reader == null || !this.isReadyRenderCenter) {
            return;
        }
        if (!this.reader.rendered) {
            // Clean before draw
            this.canvasContext.clearRect(0, 0, this._canvasEl.nativeElement.width, this._canvasEl.nativeElement.height);
            return;
        }

        let self = this;
        let options = this._options;
        let canvas = this._canvasEl.nativeElement;
        this.centerX = this.reader.width * this._options.zoom.value / 2;
        this.centerY = this.reader.height * this._options.zoom.value / 2;

        // Clean before draw
        this.canvasContext.clearRect(0, 0, canvas.width, canvas.height);
        // Save context
        this.canvasContext.save();
        // move to mouse position
        this.canvasContext.translate((this.picPos.x + this.centerX), (this.picPos.y + this.centerY));
        // Rotate canvas
        this.canvasContext.rotate(this._options.rotate.value * Math.PI / 180);
        // Go back
        this.canvasContext.translate(-this.centerX, -this.centerY);
        // Change scale
        if (this.reader.isZoom) {
            this.canvasContext.scale(this._options.zoom.value, this._options.zoom.value);
        }

        if (this.reader.img != null) {
            this.canvasContext.drawImage(this.reader.img, 0, 0, this.reader.width, this.reader.height);
            this.canvasContext.beginPath();
            this.canvasContext.rect(0, 0, this.reader.width, this.reader.height);
            this.canvasContext.lineWidth = 0.2;
            // this.canvasContext.strokeStyle = "#000000";
            this.canvasContext.strokeStyle = '#808080';
            this.canvasContext.stroke();
        }

        // Restore
        this.canvasContext.restore();

        if (this.shapes) {
            // draw all boxes
            let l = this.shapes.length;
            for (let i = 0; i < l; i++) {
                this.canvasContext.save();
                // move to mouse position
                this.canvasContext.translate((this.picPos.x + this.centerX), (this.picPos.y + this.centerY));
                // Rotate canvas
                this.canvasContext.rotate(this._options.rotate.value * Math.PI / 180);
                // Go back
                this.canvasContext.translate(-this.centerX, -this.centerY);
                // Change scale
                this.canvasContext.scale(this._options.zoom.value, this._options.zoom.value);
                let shape = this.shapes[i]
                let displaySelectedAre = this.isDrag && shape === this.selectedShape;

                // we used to call drawshape, but now each box draws itself
                // shape.render(this.canvasContext, displaySelectedAre, this.getRatio(), this.picPos);
                shape.render(this.canvasContext, displaySelectedAre);
                this.canvasContext.restore();

            }
            // ** Add stuff you want drawn on top all the time here **
        }
    }

    draggingShape($event) {
        // no selected shape or no allow drag
        if (!this.selectedShape || !this.isDrag) { return; }

        let mousePos = this.getMouse($event);
        let v = this.getRatio();
        this.selectedShape.dragging(mousePos.mx, mousePos.my, this);
        this.invalidate();
    }

    readImage(value: any) {
        if (value === undefined || value === null) { return; }

        this.isLoadingImage = true;
        // var self = this;
        // test if object or string is input of directive
        if (typeof (value) === 'object') {
            // Object type file
            if (this.imageReader.IsSupported(value.type)) {
                // get object
                let decoder = this.imageReader.CreateReader(value.type, value);
                // Create image
                this.reader = decoder.create(value, this._options, this.onload.bind(this));
            } else {
                console.log(value.type, ' not supported !');
            }
        } else if (typeof (value) === 'string') {
            this.reader = this.imageReader.CreateReader('image/jpeg').create(value, this._options, this.onload.bind(this));
        }
    }

    clearImage() {
        if (this.reader) {
            this.reader.clean();
            this.reader.img = null;
            this.invalidate();
        }
    }

    onload(sucess: boolean) {
        this.isLoadingImage = false;

        if (this.reader == null) {
            return;
        }

        if (this.reader.rendered) {
            this.applyTransform();
        } else {
            // this.resizeTo(this.scope.options.controls.fit);
            this.resizeTo();
            this.initZoom = this._options.zoom.value;
        }
    }

    resizeTo() {


        this.isReadyRenderCenter = false;
        // function round(value, precision) {
        //     var multiplier = Math.pow(10, precision || 0);
        //     return Math.round(value * multiplier) / multiplier;
        // }

        if ((this._canvasEl == null) || (this.reader == null)) {
            return;
        }

        let ratioH = (this.canvasElement.height - 10) / (this.reader.height); // -10: viewable full image
        let ratioW = (this.canvasElement.width - 10) / (this.reader.width); // -10: viewable full image

        ratioH = Math.floor(ratioH * 10) / 10; // Round 1 decimal
        ratioW = Math.floor(ratioW * 10) / 10; // Round 1 decimal        

        // No stretch
        if (ratioW > 1 && ratioH > 1) {
            this._options.controls.disableZoomIn = true;
            this._options.controls.disableZoomOut = true;
        } else {
            this._options.controls.disableZoomIn = false;
            this._options.controls.disableZoomOut = true;
            // ratioW = ratioW - this.scope.options.zoom.step;
        }

        if (ratioW > 1) {
            ratioW = 1;
            this._options.controls.disableZoomIn = true;
            this._options.controls.disableZoomOut = true;
        }

        // If reader render zoom itself
        // Precompute from its ratio
        if (!this.reader.isZoom) {
            ratioH *= this._options.zoom.value;
            ratioW *= this._options.zoom.value;
        }

        this._options.zoom.value = Math.min(ratioH, ratioW);
        // fix bug for mobile when img large more than iframe
        if (this._options.zoom.value === 0) {
            this._options.zoom.value = 0.05;
        }
        // Adjust value
        /*switch (value) {
            case 'width': this.scope.options.zoom.value = ratioW; break;
            case 'height': this.scope.options.zoom.value = ratioH; break;
            case 'page':
            default: this.scope.options.zoom.value = Math.min(ratioH, ratioW);
        }*/

        setTimeout(() => {
            if (!this.reader.isZoom) {
                if (this.reader.refresh != null) {
                    this.reader.refresh();
                }

                // Re center image
                // this.centerPics();
            } else {
                // Re center image
                this.centerPics();
                this.isReadyRenderCenter = true;
                this.applyTransform();
            }
        }, 100);
    }


    centerPics() {
        if (!this.reader || !this.reader.rendered) { return; }

        // Position to canvas center
        let centerX = this.canvasElement.width / 2;
        let centerY = this.canvasElement.height / 2;
        let picPosX = 0;
        let picPosY = 0;
        picPosX = centerX - (this.reader.width * this._options.zoom.value) / 2;
        picPosY = centerY - (this.reader.height * this._options.zoom.value) / 2;

        this.curPos = { x: picPosX, y: 0 };
        this.picPos = { x: picPosX, y: picPosY };
    }

    invalidate() {
        this.canvasValid = false;
    }

    zoom(direction) {
        let self = this;
        setTimeout(() => {
            let oldWidth, newWidth = 0;
            let oldHeight, newHeight = 0;
            // Does reader support zoom ?
            // Compute correct width
            if (!self.reader.isZoom) {
                oldWidth = this.reader.width;
                oldHeight = this.reader.height;
            } else {
                oldWidth = this.reader.width * this._options.zoom.value;
                oldHeight = this.reader.height * this._options.zoom.value;
            }

            if ((this._options.controls.disableZoomOut && direction < 0)
                || (this._options.controls.disableZoomIn && direction > 0)) { return; }

            let testingZoomValue = this._options.zoom.value;
            // Compute new zoom
            testingZoomValue += this._options.zoom.step * direction;
            // Round
            testingZoomValue = Math.round(testingZoomValue * 100) / 100;

            // In case we are in midle of zoom steps (by pinch to zoom) try to adjust it to the correct zoom steps
            let mod = testingZoomValue % this._options.zoom.step;
            if (mod > 0) {
                testingZoomValue -= mod;
            }

            // Compute new zoom
            // No stretch and no less
            if (testingZoomValue > 1) {
                this._options.zoom.value = 1;
            } else {
                this._options.zoom.value += this._options.zoom.step * direction;

                // limit in min steps to min
                if (this._options.zoom.value < this._options.zoom.min) {
                    this._options.zoom.value = this._options.zoom.min;
                }
            }

            // Compute new zoom
            // this._options.zoom.value += this._options.zoom.step * direction;
            // Round
            this._options.zoom.value = Math.round(this._options.zoom.value * 100) / 100;
            if (this._options.zoom.value >= this._options.zoom.max) {
                this._options.zoom.value = this._options.zoom.max;
            }
            if (this._options.zoom.value <= this._options.zoom.min) {
                this._options.zoom.value = this._options.zoom.min;
            }
            // Refresh picture
            if (self.reader.refresh != null) {
                self.reader.refresh();
            }

            // Compute new image size
            if (!self.reader.isZoom) {
                newWidth = self.reader.width;
                newHeight = self.reader.height;
            } else {
                newWidth = self.reader.width * this._options.zoom.value;
                newHeight = self.reader.height * this._options.zoom.value;
            }
            // new image position after zoom
            self.picPos.x = self.picPos.x - (newWidth - oldWidth) / 2;
            self.picPos.y = self.picPos.y - (newHeight - oldHeight) / 2;

            this._options.controls.disableZoomOut = this._options.zoom.value <= this.initZoom;//newWidth < this._canvasEl.nativeElement.width && newHeight < this._canvasEl.nativeElement.height;
            this._options.controls.disableZoomIn = this._options.zoom.value >= 1;

            this.applyTransform();
        }, 100);
    }

    rotate(direction: number) {
        setTimeout(() => {
            this._options.rotate.value += this._options.rotate.step * direction;
            if ((this._options.rotate.value <= -360) || (this._options.rotate.value >= 360)) {
                this._options.rotate.value = 0;
            }

            this.applyTransform();
        }, 100);
    }

    removeSelectedShape() {
        if (this.shapes && this.selectedShape) {
            let index = this.shapes.indexOf(this.selectedShape);
            if (index > -1) {
                let removed = this.shapes.splice(index, 1);

                if (this._options.shapesChanged) {
                    this._options.shapesChanged('delete', removed);
                }
            }

            this.invalidate();
        }
    }

    exportAllShapes(): any[] {
        let jsonShapes = [];

        for (let i = 0; i < this.shapes.length; i++) {
            let shape = this.shapes[i];
            jsonShapes.push(shape.exportToServer());
        }

        return jsonShapes;
    }

    // resize image canvas
    resizeCanvas() {
        let canvasSize = this.canvasElement.parentNode;
        this.canvasContext.canvas.width = canvasSize.clientWidth;
        this.canvasContext.canvas.height = canvasSize.clientHeight;
        this.centerPics();
        this.applyTransform();
        this.resizeTo();
    }
}
