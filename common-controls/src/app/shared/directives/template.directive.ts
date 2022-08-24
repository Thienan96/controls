import {Directive, Input, TemplateRef} from '@angular/core';

@Directive({
    selector: '[ntk-template]'
})
export class TemplateDirective {
    @Input('ntk-template') name = ''; // pass desired event
    constructor(public tpl: TemplateRef<any>) {

    }

}
