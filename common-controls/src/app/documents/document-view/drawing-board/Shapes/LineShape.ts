import { BaseShape, MinMax, DrawingShapeServer } from './BaseShape';
import { CanvasWrapper } from '../CanvasWrapper/CanvasWrapper';

export class LineShape  extends BaseShape {

    protected offsetx1 = 0;
    protected offsetx2 = 0;
    protected offsety1 = 0;
    protected offsety2 = 0;
    protected ArrowType = 'None';

    constructor(private x1: number, private  y1: number, private  x2: number, private  y2: number
        , lineType: string, borderColor: string, borderWidth: number, id?: string, dashStyle?: string) {
            super(borderColor, borderWidth, lineType || 'Line', id, dashStyle);

    }

    render(context: CanvasRenderingContext2D, displaySelectedArea: Boolean) {
        context.save();
        let dist = Math.sqrt((this.x2 - this.x1) * (this.x2 - this.x1) + (this.y2 - this.y1) * (this.y2 - this.y1));

        context.beginPath();
        context.lineWidth = this.getSuitableBorderWidth(context);
        context.strokeStyle = this.borderColor;
        context.moveTo(this.x1, this.y1);
        context.lineTo(this.x2, this.y2);
        context.stroke();

        if (this.shapeName === 'Arrow') {
            let angle = Math.acos((this.y2 - this.y1) / dist);

            if (this.x2 < this.x1) {angle = 2 * Math.PI - angle;}

            let size = 12;            
            let scale =  this.geCurentScale(context);   
            // if the arrow head is too small for the current zoom (4px) then try to render bugger
            if (scale && size * scale < 4) {
                size = 4 / scale;
            }            

            context.beginPath();
            context.translate(this.x2, this.y2);
            context.rotate(-angle);
            context.fillStyle = this.borderColor;
            context.lineWidth = this.getSuitableBorderWidth(context);
            context.strokeStyle = this.borderColor;
            context.moveTo(0, -size);
            context.lineTo(-size, -size);
            //context.lineTo(0, 8);
            context.lineTo(0, 4);
            context.lineTo(size, -size);
            context.lineTo(0, -size);
            context.closePath();
            context.fill();
            context.stroke();
        }

        context.restore();

        if (displaySelectedArea) {
            let mm = this.getMinMaxXY();
            BaseShape.prototype.renderSelectedArea(mm.minX, mm.minY, mm.maxX - mm.minX, mm.maxY - mm.minY, context);
        }
    }

    getMinMaxXY(): MinMax {
        let minX = Math.min(this.x1, this.x2);
        let minY = Math.min(this.y1, this.y2);
        let maxX = Math.max(this.x1, this.x2);
        let maxY = Math.max(this.y1, this.y2);

        return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    }

    contains(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        let offset = this.getOffset();
        let renderPosition = canvasWrapper.getMouseCoordRender(mx, my);
        let mm = this.getMinMaxXY();
        mm.minX = mm.minX - offset;
        mm.minY = mm.minY - offset;
        mm.maxX = mm.maxX + offset * 2;
        mm.maxY = mm.maxY + offset * 2;

        return (mm.minX <= renderPosition.x) && (mm.maxX >= renderPosition.x) &&
            (mm.minY <= renderPosition.y) && (mm.maxY >= renderPosition.y);
    }

    prepareDrag(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        let renderPosition = canvasWrapper.getMouseCoordRender(mx, my);

        this.offsetx1 = renderPosition.x - this.x1;
        this.offsety1 = renderPosition.y - this.y1;

        this.x1 = renderPosition.x - this.offsetx1;
        this.y1 = renderPosition.y - this.offsety1;

        this.offsetx2 = renderPosition.x - this.x2;
        this.offsety2 = renderPosition.y - this.y2;

        this.x2 = renderPosition.x - this.offsetx2;
        this.y2 = renderPosition.y - this.offsety2;
    }

    dragging = function (mx: number, my: number, canvasWrapper: CanvasWrapper) {
        let renderPosition = canvasWrapper.getMouseCoordRender(mx, my);
        this.x1 = renderPosition.x - this.offsetx1;
        this.y1 = renderPosition.y - this.offsety1;
        this.x2 = renderPosition.x - this.offsetx2;
        this.y2 = renderPosition.y - this.offsety2;
    };

    drawing(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        // super.drawing(mx, my, canvasWrapper);
        let m = canvasWrapper.getMouseCoordRender(mx, my);
        this.x2 = m.x;
        this.y2 = m.y;
    }

    exportToServer(): DrawingShapeServer {
        let drawingShape = new DrawingShapeServer();
        drawingShape.Name = this.id;
        drawingShape.Type = 'Line'; // server only managed Line (Arrow by property "ArrowType")
        drawingShape.Color = this.borderColor;
        drawingShape.Points.push({ X: Math.floor(this.x1), Y: Math.floor(this.y1) });
        drawingShape.Points.push({ X: Math.floor(this.x2), Y: Math.floor(this.y2) });
        drawingShape.Thickness = this.borderWidth;
        drawingShape.ArrowType = this.ArrowType;

        if (this.shapeName === 'Arrow') {
            if ((this.x1 > this.x2 && this.y1 === this.y2) || (this.x1 === this.x2 && this.y1 > this.y2)
                || (this.x1 > this.x2 && this.y1 < this.y2) || (this.x1 > this.x2 && this.y1 > this.y2)) {
                    drawingShape.ArrowType = 'LeftTop';
                } else {
                    drawingShape.ArrowType = 'RightBottom';
                }
        }

        return drawingShape;
    }
}
