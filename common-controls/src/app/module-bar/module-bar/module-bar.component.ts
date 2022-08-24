import {AfterViewInit, ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {ModuleBarService} from '../shared/module-bar.service';
import {AuthenticationService} from '../../core/services/authentication.service';
import {ModuleDefinition} from '../shared/model';
import {ModuleBarMenuComponent} from '../module-bar-menu/module-bar-menu.component';

@Component({
    selector: 'ntk-module-bar',
    templateUrl: './module-bar.component.html',
    styleUrls: ['./module-bar.component.scss'],
    host: {
        '[class.fix-height]': 'fixHeight'
    }
})
export class ModuleBarComponent implements AfterViewInit {
    @Input() value: any = []; // Menu Definition
    @Input() showHeader = true; // Is Display header
    @Input('appTitle') title: string; // The title of menu-bar
    @Input() logo: string; // The logo url in the header
    @Input() width = 250; // The width of toolbar
    @Input() itemHeight = 40; // The height of menu-item
    @Input() indent = 40; // The indent for each level
    @Input() showScrollerBar = false; // is show vertical scrollbar on the right
    @Input() openedAtOnce = true; // Is have 1 menu expand
    @Input() hasAccess: any; // The function to check menuItem can access to display
    @Input() isModuleActive: any; // check if a module item is active
    @Input() forceExpanded = false; // Always menu, disable collapse
    @Input() showCollapseButton = true;
    @Input() fixHeight = true;

    @Output() moduleItemClick = new EventEmitter<ModuleDefinition>();
    @Output() logoClick = new EventEmitter<ModuleDefinition>();
    @Output() menuButtonClick = new EventEmitter<ModuleDefinition>();
    @Output() groupItemClick = new EventEmitter<ModuleDefinition>();
    
    // [(collapsed)]
    @Input() collapsed: boolean;
    @Output() collapsedChange = new EventEmitter();
    @Output() ready = new EventEmitter();

    @ViewChild(ModuleBarMenuComponent, {static: true}) moduleBarMenuComponent: ModuleBarMenuComponent;

    get isCollapsed() {
        return this.collapsed && !this.forceExpanded;
    }

    constructor(private moduleBarService: ModuleBarService,
                private _auth: AuthenticationService,
                private cd: ChangeDetectorRef) {
        this.collapsed = this.moduleBarService.getCollapsed();
        this.collapsedChange.emit(this.collapsed);
    }

    ngAfterViewInit() {
        this.ready.emit(this.collapsed);
        this.moduleBarService.raiseReady(this.collapsed);
    }

    /**
     * Expanded|Collapse the menu-bar
     */
    setCollapse(collapsed) {
        this.collapsed = collapsed;
        this.collapsedChange.emit(this.collapsed);

        this.moduleBarService.storeCollapsed(this.isCollapsed);

        // Render
        this.cd.detectChanges();

        // Raise collapse
        this.moduleBarService.raiseCollapsed(this.isCollapsed);
    }

    onLogoClicked() {
        this.logoClick.emit();
    }

    onMenuButtonClicked() {
        this.menuButtonClick.emit();
    }

    onCollapseButton() {
        this.setCollapse(true);
    }

    toggle() {
        this.setCollapse(!this.collapsed);
    }

    getModulesDef() {
        return this.moduleBarMenuComponent.modulesDef;
    }
}
