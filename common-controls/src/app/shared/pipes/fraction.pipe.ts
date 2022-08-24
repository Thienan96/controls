import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fraction'
})
export class FractionPipe implements PipeTransform {

  transform(value: number): string {
    let surplus = value % 1;
    let surplusText = '';
    if (surplus >= 0.75) {
      surplusText = '¾';
    } else if (surplus >= 0.5) {
      surplusText = '½';
    } else if (surplus >= 0.25) {
      surplusText = '¼';
    }
    return (value - surplus).toString() + surplusText;
  }

}
