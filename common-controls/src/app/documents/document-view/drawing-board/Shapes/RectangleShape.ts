import { CanvasWrapper } from "../CanvasWrapper/CanvasWrapper";

import { DrawingShapeServer, BaseShape } from "./BaseShape";

export class RectangleShape extends BaseShape {
    protected fill = 'transparent';
    protected offsetx = 0;
    protected offsety = 0;

    constructor(protected x: number, protected  y: number, protected  w: number, protected  h: number
        , borderColor: string, borderWidth: number
        , shapeName?: string, id?: string, dashStyle?: string) {
            super(borderColor, borderWidth, shapeName || 'Rectangle', id, dashStyle);
    }

    render(context: CanvasRenderingContext2D, displaySelectedArea: Boolean) {
        // super.render(context, displaySelectedArea);
        context.fillStyle = this.fill;
        context.strokeStyle = this.borderColor;
        context.lineWidth = this.getSuitableBorderWidth(context);
        context.fillRect(this.x, this.y, this.w, this.h); //getImageData to select it
        context.strokeRect(this.x, this.y, this.w, this.h);

        if (displaySelectedArea) {
            BaseShape.prototype.renderSelectedArea(this.x, this.y, this.w, this.h, context);
        }
    }
    endDrawing(laterX: number, laterY: number) {
        if (laterX <= this.x && laterY <= this.y) {
            this.x = laterX;
            this.y = laterY;
        } else if (laterX >= this.x && laterY <= this.y) {
            this.y = laterY;
        } else if (laterX <= this.x && laterY >= this.y) {
            this.x = laterX;
        }

        this.w = Math.abs(this.w);
        this.h = Math.abs(this.h);
    }

    contains(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        let m = canvasWrapper.getMouseCoordRender(mx, my);
        return ((this.x) <= m.x) && ((this.x + this.w) >= m.x) &&
            ((this.y) <= m.y) && ((this.y + this.h) >= m.y);
    }

    prepareDrag(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        let m = canvasWrapper.getMouseCoordRender(mx, my);
        this.offsetx = m.x - this.x;
        this.offsety = m.y - this.y;
        this.x = m.x - this.offsetx;
        this.y = m.y - this.offsety;
    }

    dragging(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        let m = canvasWrapper.getMouseCoordRender(mx, my);
        this.x = m.x - this.offsetx;
        this.y = m.y - this.offsety;
    }

    drawing(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        // super.drawing(mx, my, canvasWrapper);
        let oldx = this.x;
        let oldy = this.y;
        let m = canvasWrapper.getMouseCoordRender(mx, my);
        this.w = m.x - oldx;
        this.h = m.y - oldy;
    }

    exportToServer(): DrawingShapeServer {
        let drawingShape = new DrawingShapeServer();
        drawingShape.Name = this.id;
        drawingShape.Type = this.shapeName;
        drawingShape.Color = this.borderColor;
        drawingShape.Points.push({ X: Math.floor(this.x), Y: Math.floor(this.y) });
        drawingShape.Points.push({ X: Math.floor(this.w), Y: Math.floor(this.h) });
        drawingShape.Thickness = this.borderWidth;

        return drawingShape;
    }
}
