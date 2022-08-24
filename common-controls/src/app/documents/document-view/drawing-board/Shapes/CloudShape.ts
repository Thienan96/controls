import { RectangleShape } from './RectangleShape';

export class CloudShape extends RectangleShape {
    constructor(x: number, y: number, w: number, h: number
        , borderColor: string, borderWidth: number
        , id?: string, dashStyle?: string) {
            super(x, y, w, h, borderColor, borderWidth, 'Cloud', id, dashStyle);
    }

    render(context: CanvasRenderingContext2D, displaySelectedArea: Boolean) {

        context.lineWidth = this.getSuitableBorderWidth(context);
        context.strokeStyle = this.borderColor;

        // let radiusX = (this.w) * 0.5;
        // let radiusY = (this.h) * 0.5;
        // let centerX = this.x + radiusX;
        // let centerY = this.y + radiusY;
        // let step = 0.01;
        // let a = step;
        // let pi2 = Math.PI * 2 - step;

        context.save();

        context.translate(this.x, this.y);
        context.scale(this.w / 540, this.h / 280);

        context.beginPath();        
        context.moveTo(514, 138);     
        context.bezierCurveTo(513, 155, 492, 211, 456, 205);
        context.bezierCurveTo(455, 204, 454, 205, 454, 206);
        context.bezierCurveTo(452, 245, 369, 269, 353, 248);
        context.bezierCurveTo(353, 248, 352, 248, 352, 249);
        context.bezierCurveTo(355, 274, 266, 282, 260, 254);
        context.bezierCurveTo(260, 254, 259, 253, 259, 254);
        context.bezierCurveTo(245, 284, 150, 271, 157, 245);
        context.bezierCurveTo(157, 244, 156, 244, 156, 245);
        context.bezierCurveTo(126, 269, 58, 239, 71, 212);
        context.bezierCurveTo(71, 212, 70, 210, 70, 210);
        context.bezierCurveTo(34, 230, -6, 158, 33, 141);
        context.bezierCurveTo(33, 141, 32, 139, 32, 138);
        context.bezierCurveTo(22, 114, 57, 51, 104, 76);
        context.bezierCurveTo(105, 76, 106, 75, 106, 75);
        context.bezierCurveTo(93, 21, 211, -16, 256, 9);
        context.bezierCurveTo(257, 10, 257, 10, 258, 9);
        context.bezierCurveTo(293, -12, 461, 8, 462, 55);
        context.bezierCurveTo(462, 55, 463, 56, 464, 56);
        context.bezierCurveTo(514, 55, 516, 106, 514, 138);

        // cloud from Stackoverflow
        // context.arc(this.x, this.y, 60, Math.PI * 0.5, Math.PI * 1.5);
        // context.arc(this.x + 70, this.y - 60, 70, Math.PI * 1, Math.PI * 1.85);
        // context.arc(this.x + 152, this.y - 45, 50, Math.PI * 1.37, Math.PI * 1.91);
        // context.arc(this.x + 200, this.y, 60, Math.PI * 1.5, Math.PI * 0.5);
        // context.moveTo(this.x + 200, this.y + 60);
        // context.lineTo(this.x, this.y + 60);
        // context.strokeStyle = this.borderColor;
        // context.stroke();
        // context.fillStyle = '#8ED6FF';
        // context.fill()



        // from ellips
        // let radiusX = (this.w) * 0.5;
        // let radiusY = (this.h) * 0.5;
        // let centerX = this.x + radiusX;
        // let centerY = this.y + radiusY;
        // let step = 0.01;
        // let a = step;
        // let pi2 = Math.PI * 2 - step;

        // // context.canvas.innerHTML
        // // context.sh
        // context.lineWidth = this.borderWidth;
        // context.strokeStyle = this.borderColor;
        // context.beginPath();
        // context.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));
        // for (; a < pi2; a += step) {
        //     context.lineTo(centerX + radiusX * Math.cos(a), centerY + radiusY * Math.sin(a));
        // }

        context.closePath();        
        context.stroke();

        context.restore();

        if (displaySelectedArea) {
            super.renderSelectedArea(this.x, this.y, this.w, this.h, context);
        }
    }
}
