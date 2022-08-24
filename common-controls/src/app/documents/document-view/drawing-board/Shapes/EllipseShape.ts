import { RectangleShape } from './RectangleShape';

export class EllipseShape extends RectangleShape {
    constructor(x: number, y: number, w: number, h: number
        , borderColor: string, borderWidth: number
        , id?: string, dashStyle?: string) {
            super(x, y, w, h, borderColor, borderWidth, 'Ellipse', id, dashStyle);
    }

    render(context: CanvasRenderingContext2D, displaySelectedArea: Boolean) {
        let radiusX = (this.w) * 0.5;
        let radiusY = (this.h) * 0.5;
        let centerX = this.x + radiusX;
        let centerY = this.y + radiusY;
        let step = 0.01;
        let a = step;
        let pi2 = Math.PI * 2 - step;
        
        context.lineWidth = this.getSuitableBorderWidth(context);
        context.strokeStyle = this.borderColor;
        context.beginPath();
        context.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));
        for (; a < pi2; a += step) {
            context.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY * Math.sin(a));
        }

        context.closePath();
        context.stroke();

        if (displaySelectedArea) {
            super.renderSelectedArea(this.x, this.y, this.w, this.h, context);
        }
    }
}
