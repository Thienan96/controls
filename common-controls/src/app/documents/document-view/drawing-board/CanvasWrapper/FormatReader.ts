import { Renderer2 } from '@angular/core';

export class FormatReader {
    private img: HTMLImageElement;
    private reader: FileReader;
    private width: number;
    private  height: number;

    private rendered = false;

    private data: any;
    private isZoom = false;

    private mimetype = [];
    constructor(private _renderer: Renderer2) {
        this.mimetype = [
            'image/png',
            'image/jpeg'
        ];
    }


    // Runs during compile
    CreateReader(mimeType: string, obj?: any) : any {
        let reader = null;

        if (mimeType === '' && obj) {
            mimeType = this.GuessMimeType(obj);
        }

        switch (mimeType.toLowerCase()) {
            case 'image/png':
            case 'image/jpeg': reader = {
                create: (data: any, options: any, callback: () => void ): ImageReader => {
                    return new ImageReader(data, options, callback);
                }
            }; break;
        };
        return reader;
    }

    IsSupported(mimeType) {
        return (this.mimetype.indexOf(mimeType) !== -1);
    }

    GuessMimeType(obj) {
        // try to guess mime type if not available
        let mimeType = '';
        if (obj.type === '') {
            let fileName = obj.name;
            mimeType = 'image/' + fileName.substring(fileName.indexOf('.') + 1);
        }
        return mimeType.toLowerCase();
    }
}

export class ImageReader {

    reader: FileReader;
    img: HTMLImageElement;
    width: number;
    height: number;

    rendered = false
    data: any;

    isZoom: boolean;

    constructor(data: any, options: any, callback: (result: boolean) => void) {
        this.reader = new FileReader();
        this.img = new Image();
        let that = this;
        this.img.onload = () => {
            that.width = that.img.width;
            that.height = that.img.height;
            callback(true);
            that.rendered = true;
            options.info.isLoadedImage = true;
        }
        this.img.onerror  = (error) => {
            callback(false);
        }
        this.data = null;
        this.width = -1;
        this.height = -1;
        options.info = {};
        options.info.isLoadedImage = false;
        this.isZoom = true;
        this.rendered = false;
        this.reader.onload = function () {
            that.img.src = <string>that.reader.result;
        };
        if (typeof (data) === 'string') {
            this.img.src = data;
        } else {
            this.reader.readAsDataURL(data);
        }
    }

    refresh() {
        //do nothing at the moment
    }

    clean() {
        this.img.src = '';
    }
}
