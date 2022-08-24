import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[ntkColorContrast]'
})
// resource: https://github.com/evert0n/angular-color-contrast/blob/master/src/color-contrast.js
export class ColorContrastDirective implements OnChanges {
  @Input() ntkColorContrast;
  DARK = '000000';
  LIGHT = 'FFFFFF';
  constructor(private elementRef: ElementRef, private render: Renderer2) {
  }
  ngOnChanges(changes: SimpleChanges) {
    if (!!changes['ntkColorContrast'] && this.ntkColorContrast) {
      this.render.setStyle(this.elementRef.nativeElement, 'background', this.ntkColorContrast);
      this.render.setStyle(this.elementRef.nativeElement, 'color', `#${this.getContrastYIQ(this.stripNumberSign(this.ntkColorContrast))}`);
    }
  }
  getContrastYIQ(hexcolor) {
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? this.DARK : this.LIGHT;
  }
  stripNumberSign(color) {
    if (color[0] === '#') {
      color = color.substring(1, color.length);
    }
    return color;
  }
}
