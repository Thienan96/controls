import {Component, ElementRef, Input} from '@angular/core';
import {ModuleDefinition} from '../shared/model';

@Component({
    selector: 'ntk-module-item',
    templateUrl: './module-bar-item.component.html',
    styleUrls: ['./module-bar-item.component.scss']
})
export class ModuleBarItemComponent {
    @Input() moduleDef: ModuleDefinition;
    @Input() indent: number;
    @Input() isCollapsed: boolean;

    constructor(private el: ElementRef) {
    }

    getElementRef(): ElementRef {
        return this.el;
    }


}
