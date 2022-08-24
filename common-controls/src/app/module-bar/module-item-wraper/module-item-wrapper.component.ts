import {Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {ModuleDefinition} from '../shared/model';
import {ModuleBarItemComponent} from '../module-bar-item/module-bar-item.component';
import {ModuleBarMenuComponent} from '../module-bar-menu/module-bar-menu.component';


@Component({
    selector: 'ntk-module-item-wrapper',
    templateUrl: './module-item-wrapper.component.html',
    styleUrls: ['./module-item-wrapper.component.scss'],
    host: {
        '[class.is-separate]': 'moduleDef.isSeparate'
    }
})
export class ModuleItemWrapperComponent {
    @Input() moduleDef: ModuleDefinition;
    @Input() indent: number;
    @Input() parent: ModuleBarMenuComponent;
    @Input() itemHeight: number;
    @Input() isCollapsed: boolean;

    @Output() moduleItemClick = new EventEmitter<ModuleDefinition>();
    @Output() expandStateChanged = new EventEmitter<{ item: ModuleDefinition }>();

    @ViewChild(ModuleBarItemComponent, {static: false}) moduleBarItemComponent: ModuleBarItemComponent;
    @ViewChildren(ModuleItemWrapperComponent) childItems: QueryList<ModuleItemWrapperComponent>;

    /**
     * Trigger if click on menu-item
     * Expand|Collapse if menu-item have child, Trigger state changed
     * Trigger click if menu-item don't have child
     * @param moduleDef
     */
    onModuleItemClick(moduleDef: ModuleDefinition) {
        if (moduleDef.children && moduleDef.children.length > 0) {
            moduleDef.isExpanded = !moduleDef.isExpanded;
            this.expandStateChanged.emit({item: moduleDef});
        } else {
            this.moduleItemClick.emit(moduleDef);
        }
    }

    getElementRefOfModuleBarItem(): ElementRef {
        return this.moduleBarItemComponent.getElementRef();
    }

}
