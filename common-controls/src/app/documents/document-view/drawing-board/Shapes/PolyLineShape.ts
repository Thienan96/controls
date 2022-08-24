import { BaseShape, Point, MinMax, DrawingShapeServer } from './BaseShape';
import { CanvasWrapper } from '../CanvasWrapper/CanvasWrapper';

export class PolyLineShape extends BaseShape {
    constructor(private points: Point[], borderColor: string, borderWidth: number, id?: string, dashStyle?: string) {
        super(borderColor, borderWidth, 'PolyLine', id, dashStyle);
    }

    render(context: CanvasRenderingContext2D, displaySelectedArea: Boolean) {
        //super.render(context, displaySelectedArea);

        context.lineWidth = this.getSuitableBorderWidth(context);
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.lineCap = 'round';
        for (let i = 1; i < this.points.length; i++) {
            context.moveTo(this.points[i - 1].x, this.points[i - 1].y);
            context.lineTo(this.points[i].x, this.points[i].y);
        }

        context.closePath();
        context.stroke();

        if (displaySelectedArea) {
            let mm = this.getMinMaxXY();
            super.renderSelectedArea(mm.minX, mm.minY, mm.maxX - mm.minX, mm.maxY - mm.minY, context);
        }
    }

    getMinMaxXY(): MinMax {
        let minX = 0;
        let minY = 0;
        let maxX = 0;
        let maxY = 0;
        if (this.points.length > 0) {
            minX = this.points[0].x;
            minY = this.points[0].y;
            maxX = this.points[0].x;
            maxY = this.points[0].y;
            for (let i = 1; i < this.points.length; i++) {
                minX = Math.min(this.points[i].x, minX);
                minY = Math.min(this.points[i].y, minY);
                maxX = Math.max(this.points[i].x, maxX);
                maxY = Math.max(this.points[i].y, maxY);
            }
        }

        return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
    }

    drawing(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        // super.drawing(mx, my, canvasWrapper);
        let renderPosition = canvasWrapper.getMouseCoordRender(mx, my);
        this.points.push({ x: renderPosition.x, y: renderPosition.y });
    }

    contains(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        if (this.points.length > 0) {
            let offset = this.getOffset();
            let mm = this.getMinMaxXY();
            let renderPosition = canvasWrapper.getMouseCoordRender(mx, my);
            mm.minX = mm.minX - offset;
            mm.minY = mm.minY - offset;
            mm.maxX = mm.maxX + offset * 2;
            mm.maxY = mm.maxY + offset * 2;

            return (mm.minX <= renderPosition.x) && (mm.maxX >= renderPosition.x) &&
                (mm.minY <= renderPosition.y) && (mm.maxY >= renderPosition.y);
        }

        return false;
    }

    prepareDrag(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        let renderPosition = canvasWrapper.getMouseCoordRender(mx, my);
        for (let i = 0; i < this.points.length; i++) {
            let offsetx = renderPosition.x - this.points[i].x;
            let offsety = renderPosition.y - this.points[i].y;
            this.points[i].x = renderPosition.x - offsetx;
            this.points[i].offsetx = offsetx;
            this.points[i].y = renderPosition.y - offsety;
            this.points[i].offsety = offsety;
        }
    }

    dragging(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        let renderPosition = canvasWrapper.getMouseCoordRender(mx, my);
        for (let i = 0; i < this.points.length; i++) {
            this.points[i].x = renderPosition.x - this.points[i].offsetx;
            this.points[i].y = renderPosition.y - this.points[i].offsety;
        }
    }

    exportToServer(): DrawingShapeServer {
        let drawingShape = new DrawingShapeServer();
        drawingShape.Type = 'Polyline';
        drawingShape.Color = this.borderColor;
        drawingShape.Name = this.id;
        drawingShape.Thickness = this.borderWidth;
        for (let i = 0; i < this.points.length; i++) {
            drawingShape.Points.push({ X: Math.floor(this.points[i].x), Y: Math.floor(this.points[i].y) });
        }

        return drawingShape;
    }

}
