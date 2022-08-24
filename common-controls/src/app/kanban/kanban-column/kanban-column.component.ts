import {AfterContentInit, Component, ContentChildren, Input, QueryList, TemplateRef} from '@angular/core';
import {TemplateDirective} from '../../shared/directives/template.directive';

@Component({
    selector: 'ntk-kanban-column',
    template: ''
})
export class KanbanColumnComponent implements AfterContentInit {
    @Input() name: string;
    @Input() title: string;
    @Input() class: string;
    @ContentChildren(TemplateDirective) templateDirectives: QueryList<TemplateDirective>;
    itemTemplate: TemplateRef<any>;

    ngAfterContentInit() {
        this.templateDirectives.forEach((item) => {
            this.itemTemplate = item.tpl;
        });
    }
}
