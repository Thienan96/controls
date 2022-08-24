import { CanvasWrapper } from '../CanvasWrapper/CanvasWrapper';

export class BaseShape {
    constructor(protected borderColor: string, protected  borderWidth: number
        , protected  shapeName: string, protected  id: string, protected  dashStyle: string) {
    }

    // from: https://stackoverflow.com/questions/16359246/how-to-extract-position-rotation-and-scale-from-matrix-svg
    private deltaTransformPoint(matrix, point)  {

        var dx = point.x * matrix.a + point.y * matrix.c + 0;
        var dy = point.x * matrix.b + point.y * matrix.d + 0;
        return { x: dx, y: dy };
    }

    // from: https://stackoverflow.com/questions/16359246/how-to-extract-position-rotation-and-scale-from-matrix-svg
    private decomposeMatrix(matrix) {

        // @see https://gist.github.com/2052247

        // calculate delta transform point
        var px = this.deltaTransformPoint(matrix, { x: 0, y: 1 });
        var py = this.deltaTransformPoint(matrix, { x: 1, y: 0 });

        // calculate skew
        var skewX = ((180 / Math.PI) * Math.atan2(px.y, px.x) - 90);
        var skewY = ((180 / Math.PI) * Math.atan2(py.y, py.x));

        return {

            translateX: matrix.e,
            translateY: matrix.f,
            scaleX: Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b),
            scaleY: Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d),
            skewX: skewX,
            skewY: skewY,
            rotation: skewX // rotation is the same as skew x
        };        
    }

    // in mobile modein case the scale too small = 0.1 then the shape thickness become to small to see
    // in this case we need to calculate again the temp thickness so that it can be easy to see
    protected getSuitableBorderWidth(context: CanvasRenderingContext2D): number {
        let transform =   context.getTransform();       
        let originalMatrix = this.decomposeMatrix(transform);        
        
        let borderWidth = this.borderWidth;
        // example scale = 0.2 then:  3 * 0.2 = 0.6 will less than 1px
        // try 1 / 0.2 = 5 then 5 * 0.2 = 1px in render
        if (transform.a && this.borderWidth * originalMatrix.scaleX < 1) {
            borderWidth = 1 / originalMatrix.scaleX;
        }        
        
        return borderWidth;
    }

    protected geCurentScale(context: CanvasRenderingContext2D): number {
        let transform =   context.getTransform();       
        let originalMatrix = this.decomposeMatrix(transform);

        return originalMatrix.scaleX;
    }

    render(context: CanvasRenderingContext2D, displaySelectedArea: Boolean) {
        throw Error('render not implemented');
    }
    drawing(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        throw Error('drawing not implemented');
    }

    prepareDrag(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        throw Error('prepareDrag not implemented');
    }

    dragging(mx: number, my: number, canvasWrapper: CanvasWrapper) {
        throw Error('dragging not implemented');
    }

    endDrawing(laterX: number, laterY: number) {
        //throw Error('endDrawing not implemented');
    }

    contains(mx: number, my: number, canvasWrapper: CanvasWrapper): boolean {
        throw Error('contains not implemented');
    }

    exportToServer(): DrawingShapeServer {
        throw Error('exportToServer not implemented');
    }

    renderSelectedArea(x: number, y: number, w: number, h: number, context: CanvasRenderingContext2D) {
        let offsetXY = this.getOffset() + 12; // this.borderWidth; //padding selected area

        context.beginPath();
        context.lineWidth = 1;
        context.fillStyle = 'rgba(211, 211, 211,0.4)';
        context.setLineDash([3, 3]); /*dashes are 5px and spaces are 3px*/
        context.fillRect(x - offsetXY, y - offsetXY, w + offsetXY * 2, h + offsetXY * 2);
        context.strokeStyle = 'rgba(255, 0, 0, 0.3)';
        context.strokeRect(x - offsetXY, y - offsetXY, w + offsetXY * 2, h + offsetXY * 2);
        context.stroke();
        context.setLineDash([]);
    }

    getOffset() {
        let offset = 20;
        return offset;
    }
}

export class MinMax { minX: number; minY: number; maxX: number; maxY: number }

export class DrawingShapeServer {
    Type: string;
    Color: string;
    Text: string;
    Thickness: number;
    Name: string;
    ArrowType: string;
    Points = [];

    rgbToHex(color: string): string {
        throw Error('rgbToHex not implemented');
    }
}

export class Point {x: number; y: number; offsetx?: number; offsety?: number }
