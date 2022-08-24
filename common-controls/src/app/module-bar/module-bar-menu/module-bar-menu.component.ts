import {
    AfterViewInit,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ElementRef, EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    OnInit, Output,
    QueryList,
    SimpleChanges,
    ViewChild,
    ViewChildren
} from '@angular/core';
import {ModuleDefinition} from '../shared/model';
import {Subscription} from 'rxjs';
import {ModuleItemWrapperComponent} from '../module-item-wraper/module-item-wrapper.component';
import {ModuleBarService} from '../shared/module-bar.service';
import {AuthenticationService} from '../../core/services/authentication.service';
import {RouterService} from '../../core/services/router.service';
import {Router} from '@angular/router';
import {Location} from '@angular/common';

@Component({
    selector: 'ntk-module-bar-menu',
    templateUrl: './module-bar-menu.component.html',
    styleUrls: ['./module-bar-menu.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModuleBarMenuComponent implements AfterViewInit, OnDestroy, OnInit, OnChanges {
    @Input() value: any = []; // Menu Definition
    @Input() itemHeight = 40; // The height of menu-item
    @Input() indent = 40; // The indent for each level
    @Input() openedAtOnce = true; // Is have 1 menu expand
    @Input() hasAccess: any; // The function to check menuItem can access to display
    @Input() isModuleActive: any; // The function to check menuItem can access to display
    @Input() isCollapsed = false;  // The menu bar is collapse (only see icon on the view)
    @Input() showScrollerBar = false; // is show vertical scrollbar on the right
    @Output() moduleItemClick = new EventEmitter<ModuleDefinition>();
    @Output() groupItemClick = new EventEmitter<ModuleDefinition>();

    @ViewChild('modulesBarContainer', {static: false}) modulesBarContainer: ElementRef;
    @ViewChild('modulesBarItemsOffset', {static: false}) modulesBarItemsOffset: ElementRef;
    @ViewChildren('menuGroup') modulesBarItems: QueryList<ModuleItemWrapperComponent>;

    shouldShowScroller = false; // Is The menu need scroll
    canGoDown = false; // Can go down
    canGoUp = false; // Can fo up
    modulesDef: ModuleDefinition[] = []; // Available menu to display

    private _offset = 0; // Scroll position
    private _stateChangeSub: Subscription;
    private _modulesAccessRights: Subscription;
    private _currentMenuItems: ElementRef[] = []; // Contain  element which expanded
    private _routerUrl: string;

    constructor(private routerService: RouterService,
                private moduleBarService: ModuleBarService,
                private auth: AuthenticationService,
                private router: Router,
                private cd: ChangeDetectorRef,
                private location: Location) {

        this._stateChangeSub = this.routerService.onRouteNavStartChanged.subscribe((event) => {

            this._routerUrl = event.url;

            // Update active
            this.updateActiveMenuItems();

            // Collapse all menu
            this.collapse();

            // Expand parent of item active
            this.expandParentOfMenuActive();


            // Render layout
            this.updateLayout();

            // Get elementRefs
            this.buildListOfMenuElements();

            this.updateLayout();


            // Restore scroll from storage and scroll to menu item active if item is outside viewport
            this.computeShouldShowScroller();

            this.updateLayout();

            let activedItem = this.getActivedItem();
            if (activedItem && !this.isItemInView(activedItem)) {
                this.scrollToItem(activedItem);
                this.updateLayout();
            }
        });

        this._modulesAccessRights = this.moduleBarService.onUpdateModulesAccessRights().subscribe(() => {
            this.buildMenu();
        });
    }


    /**
     * Get position of scrollbar
     */
    get offsetTop(): number {
        return this._offset;
    }

    /**
     * Set position of vertical scrollbar
     * @param val
     */
    set offsetTop(val: number) {
        // offset value must greater than 0
        this._offset = Math.max(val, 0);


        if (this.showScrollerBar) {
            this.modulesBarItemsOffset.nativeElement.style.setProperty('-webkit-transform', 'translateY(0px)');
            this.modulesBarItemsOffset.nativeElement.style.setProperty('transform', 'translateY(0px)');

            this.modulesBarContainer.nativeElement.scrollTop = this._offset;
        } else {
            this.modulesBarContainer.nativeElement.scrollTop = 0;

            this.modulesBarItemsOffset.nativeElement.style.setProperty('-webkit-transform', 'translateY(-' + (this._offset || 0) + 'px)');
            this.modulesBarItemsOffset.nativeElement.style.setProperty('transform', 'translateY(-' + (this._offset || 0) + 'px)');
        }


        this.moduleBarService.storeScrollBarPosition(val);


        this.computeCanGoButton();
    }

    /**
     * Count the items availability screen
     */
    get itemCount(): number {
        return this._currentMenuItems.length;
    }


    /**
     * The height menu
     */
    get containerHeight(): number {
        let containerHeight = 0;
        if (!!this.modulesBarContainer) {
            containerHeight = this.modulesBarContainer.nativeElement.clientHeight;
        }

        return containerHeight;
    }

    ngOnInit() {

        // Set routerUrl from location
        this._routerUrl = this.location.path();

        // Build all menu
        this.buildMenu();

        // Set active for menu items
        this.updateActiveMenuItems();

        this.expandParentOfMenuActive();
    }


    ngAfterViewInit() {

        // Get elementRefs
        this.buildListOfMenuElements();


        this.updateLayout();


        // Restore scroll from storage and scroll to menu item active if item is outside viewport
        this.computeShouldShowScroller();

        this.updateLayout();

        this._offset = this.moduleBarService.getScrollBarPosition();
        this.offsetTop = this.makeSureOffsetInAcceptableRange(this._offset);


        this.updateLayout();
        let activedItem = this.getActivedItem();
        if (activedItem && !this.isItemInView(activedItem)) {
            this.scrollToItem(activedItem);
        }

        // Store scroll position when scroll if support scrollbar
        $(this.modulesBarContainer.nativeElement).on('scroll', (ev) => {
            if (this.showScrollerBar) {
                this._offset = ev.target.scrollTop;
                this.moduleBarService.storeScrollBarPosition(this._offset);
            }
        });

        // Turn on animation for menu
        this.setAnimation();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.showScrollerBar && !changes.showScrollerBar.isFirstChange()) {
            // Restore scroll from storage and scroll to menu item active if item is outside viewport
            this.computeShouldShowScroller();

            this.updateLayout();

            this._offset = this.moduleBarService.getScrollBarPosition();
            this.offsetTop = this.makeSureOffsetInAcceptableRange(this._offset);
        }
    }

    ngOnDestroy() {
        this._stateChangeSub.unsubscribe();
        this._modulesAccessRights.unsubscribe();
    }

    gotoModule(module: ModuleDefinition) {
        let moduleName = module.routeName;
        if (this.routerService.getCurrentState() !== moduleName && !module.isCommand) {
            if (typeof moduleName === 'object') {
                this.routerService.navigateTo(moduleName).then();
            } else {
                this.routerService.navigateTo([moduleName]).then();
            }
        }

        this.moduleItemClick.emit(module);
    }


    goUp() {
        let lastItem: any;
        if (!this.modulesBarItems) {
            return;
        }

        for (let item of this._currentMenuItems) {
            let el = item.nativeElement;
            lastItem = el;

            if (this.getOffsetTop(el) + el.offsetHeight >= this.offsetTop) {
                break;
            }
        }

        if (!!lastItem) {
            this.offsetTop = this.makeSureOffsetInAcceptableRange(this.getOffsetTop(lastItem) + lastItem.offsetHeight - this.containerHeight);
        }
    }

    goDown() {
        if (!this.modulesBarItems) {
            return;
        }
        let lastItem: any;
        for (let item of this._currentMenuItems) {
            let el = item.nativeElement;

            if (((this.getOffsetTop(el) + el.offsetHeight) - this.offsetTop) > this.containerHeight) {
                lastItem = el;
                break;
            }
        }
        if (!!lastItem) {
            this.offsetTop = this.makeSureOffsetInAcceptableRange(this.getOffsetTop(lastItem));
        }
    }

    /**
     * Compute scrollbar when module-bar was resized
     */
    onResize() {
        this.computeScroller();
    }

    /**
     * Expand|Collapse when click on group header
     * @param $event
     */
    onGroupExpandStateChanged($event: { item: ModuleDefinition }) {
        // Collapse item and children if collapse item
        if (!$event.item.isExpanded) {
            this.collapseNode($event.item);
        }

        if (this.openedAtOnce) {
            // Find and close siblings
            let sibs = this.findSiblings($event.item, new ModuleDefinition({
                children: this.modulesDef,
                isExpanded: true
            }), []);
            sibs.forEach((item) => {
                if (item.id !== $event.item.id && item.isExpanded) {
                    this.collapseNode(item);
                }
            });
        }
        this.groupItemClick.emit($event.item);

        setTimeout(() => {
            this.computeScroller();
        }, 10);
    }


    /**
     * Travel the child of node
     * @param node
     * @param callback
     */
    private travelNode(node: ModuleDefinition, callback) {
        return this.moduleBarService.travelNode(node, callback);
    }

    /**
     * Travel the menu
     * @param callback
     * @param node
     */
    private travelMenu(callback, node?: ModuleDefinition) {
        return this.moduleBarService.travelMenu(this.modulesDef, callback, node);
    }

    private travelParent(node: ModuleDefinition, callback) {
        if (node.parent) {
            callback(node.parent);
            this.travelParent(node.parent, callback);
        }
    }

    private travelElement(node: ModuleItemWrapperComponent, callback) {
        callback(node);
        if (node.childItems) {
            node.childItems.forEach((child) => {
                this.travelElement(child, callback);
            });
        }
    }

    private travelMenuElement(callback, node?: ModuleItemWrapperComponent) {
        if (!node) {
            this.modulesBarItems.forEach((modulesBarItem) => {
                this.travelElement(modulesBarItem, callback);
            });
        } else {
            this.travelElement(node, callback);
        }
    }

    /**
     * Collapse a node and collapse the child of node
     * @param node
     */
    private collapseNode(node: ModuleDefinition) {
        this.travelNode(node, (item: ModuleDefinition) => {
            item.isExpanded = false;
        });
    }

    /**
     * Find the siblings of a node
     * @param find
     * @param node
     * @param siblings
     */
    private findSiblings(find: ModuleDefinition, node: ModuleDefinition, siblings: ModuleDefinition[]): ModuleDefinition[] {
        if (node.id === find.id) {
            return siblings;
        }
        // tslint:disable-next-line:prefer-for-of
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                let child = node.children[i];
                let sibs = this.findSiblings(find, child, node.children);
                if (sibs && sibs.length > 0) {
                    return sibs;
                }
            }
        }

    }

    /**
     * Set active for menu iten
     */
    private updateActiveMenuItems() {
        this.travelMenu((node: ModuleDefinition) => {
            if (!node.isSeparate) {
                node.isActive = this.isActive(node);
            }
        });
    }

    /**
     * Get last elementRef
     */
    private getLastItem(): Element {
        if (this._currentMenuItems[this._currentMenuItems.length - 1]) {
            return this._currentMenuItems[this._currentMenuItems.length - 1].nativeElement;
        }
        return null;
    }

    /**
     * Compute can go down
     */
    private computeCanGoDown(): void {
        if (!this.modulesBarContainer) {
            return;
        }

        let lastItem = this.getLastItem();
        this.canGoDown = lastItem && ((this.getOffsetTop(lastItem) + $(lastItem).height()) - this.offsetTop) > this.containerHeight;
    }

    /**
     * Compute can go up
     */
    private computeCanGoUp() {
        this.canGoUp = this.offsetTop > 0;
    }

    /**
     * Compute state of 2 button (Down|Up)
     */
    private computeCanGoButton() {
        this.computeCanGoDown();
        this.computeCanGoUp();
    }

    private getOffsetTop(el: Element): number {
        return $(el).offset().top - $(this.modulesBarItemsOffset.nativeElement).offset().top;
    }

    /**
     * Compute should show scroller
     */
    private computeShouldShowScroller(): void {
        if (!this.modulesBarContainer || !this.modulesBarItems) {
            return;
        }

        // calculate total items height
        let totalItemsHeight = this.itemCount * this.itemHeight;
        this.shouldShowScroller = (this.containerHeight - totalItemsHeight) < 0;
    }

    /**
     * Make sure the scroll in the acceptable range
     * @param value
     */
    private makeSureOffsetInAcceptableRange(value: number): number {
        if (this.itemCount === 0 || !this.shouldShowScroller) {
            return 0;
        }

        // calculate total height of items
        let lastItem = this.getLastItem();
        let totalItemHeight = this.getOffsetTop(lastItem) + $(lastItem).height();

        // offset value must greater than 0
        value = Math.max(0, value);

        // offset value must less than the offset height
        value = Math.min(totalItemHeight - this.containerHeight, value);
        return value;
    }

    /**
     * Build menu-item
     * @param node
     */
    private buildNode(node: ModuleDefinition): ModuleDefinition {
        let children = [];


        // tslint:disable-next-line:prefer-for-of
        if (node.children) {
            for (let i = 0; i < node.children.length; i++) {
                let child = new ModuleDefinition(node.children[i]);
                child.level = (node.level || 0) + 1;
                let newNode = this.buildNode(child);
                if (newNode) {
                    children.push(newNode);
                }

            }
        }


        let newNode = new ModuleDefinition(node);
        if (node.children) {
            newNode.children = children;
        }


        children.forEach((item) => {
            item.parent = newNode;
        });

        if (this._hasAccess(node)) { // check access of node
            return newNode;
        }

    }

    /**
     * Build the menu
     */
    private buildMenu() {
        // Reset menu and
        this.modulesDef.splice(0, this.modulesDef.length);

        // Rebuild the menu
        if (this.value) {
            for (let item of this.value) {
                let newNode = this.buildNode(item);
                if (newNode) {
                    this.modulesDef.push(newNode);
                }
            }
        }
    }

    /**
     * Compute the scroll
     */
    private computeScroller() {
        // Get elementRefs
        this.buildListOfMenuElements();

        // Compute should show scrollbar
        this.computeShouldShowScroller();


        this.safeApply();

        this.offsetTop = this.makeSureOffsetInAcceptableRange(this.offsetTop);

        this.safeApply();
    }

    private buildElementRef(node: ModuleItemWrapperComponent) {
        if (!node.moduleDef.isSeparate) {
            this._currentMenuItems.push(node.getElementRefOfModuleBarItem());
        }

        if (node.moduleDef.children && node.moduleDef.children.length > 0 && node.moduleDef.isExpanded) {
            node.childItems.forEach((item: ModuleItemWrapperComponent) => {
                this.buildElementRef(item);
            });
        }
    }

    /**
     * Build elmentRefs which is availability
     */
    private buildListOfMenuElements() {
        this._currentMenuItems.splice(0, this._currentMenuItems.length);
        this.modulesBarItems.forEach(item => {
            this.buildElementRef(item);
        });
    }

    /**
     * Check access menu-item
     * @param node
     * @private
     */
    private _hasAccess(node: ModuleDefinition): boolean {
        return this.hasAccess ? this.hasAccess(node) : true;
    }


    private safeApply() {
        try {
            this.cd.detectChanges();
        } catch {
        }
    }

    private updateLayout() {
        this.safeApply();
    }

    private findModuleItemByModuleDefinition(node: ModuleDefinition) {
        let modulesBarItem: ModuleItemWrapperComponent = null;
        this.travelMenuElement((item) => {
            if (item.moduleDef.routeName === node.routeName) {
                modulesBarItem = item;
            }
        });
        return modulesBarItem;
    }

    private isItemInView(node: ModuleDefinition): boolean {
        let modulesBarItem = this.findModuleItemByModuleDefinition(node);
        return modulesBarItem ? this.elementInViewport(modulesBarItem.getElementRefOfModuleBarItem().nativeElement) : false;
    }

    private elementInViewport(el) {
        let position = this.getPositionOfItem(el);
        return position === 3;
    }

    private getPositionOfItem(el: Element): number {
        const $el = $(el);
        let container = $(this.modulesBarContainer.nativeElement);

        let off1 = $el.offset();
        let rect1 = {
            left: off1.left,
            right: off1.left + $el.width(),
            top: off1.top,
            bottom: off1.top + $el.height()
        };

        let off2 = container.offset();
        let rect2 = {
            left: off2.left,
            right: off2.left + container.width(),
            top: off2.top,
            bottom: off2.top + container.height()
        };

        if (rect1.bottom < rect2.top) {// Out-Out (top)
            return 1;
        }
        if (rect1.top < rect2.top && rect1.bottom >= rect2.top) { // Out-In
            return 2;
        }
        if (rect1.top >= rect2.top && rect1.bottom <= rect2.bottom) { // In-In
            return 3;
        }
        if (rect1.top >= rect2.top && rect1.bottom >= rect2.bottom) { // In-Out
            return 4;
        }
        if (rect1.top > rect2.bottom) { // Out-Out (bottom)
            return 5;
        }
    }

    private scrollToItem(node: ModuleDefinition) {
        let moduleItem = this.findModuleItemByModuleDefinition(node);
        if (moduleItem) {
            let top = $(moduleItem.getElementRefOfModuleBarItem().nativeElement).offset().top - $(this.modulesBarItemsOffset.nativeElement).offset().top;
            this.offsetTop = this.makeSureOffsetInAcceptableRange(top);
        }
    }

    private getActivedItem(): ModuleDefinition {
        let activedItem: ModuleDefinition = null;
        this.travelMenu((node: ModuleDefinition) => {
            if (node.isActive) {
                activedItem = node;
            }
        });
        return activedItem;
    }


    private setAnimation() {
        // Animation scroll
        if (!this.showScrollerBar) {
            this.modulesBarItemsOffset.nativeElement.className = this.modulesBarItemsOffset.nativeElement.className + ' animation';
        }
    }

    private expandParentOfMenuActive() {
        // Expand parent of menu item active
        this.travelMenu((node) => {
            if (node.isActive) {
                this.travelParent(node, (n: ModuleDefinition) => {
                    n.isExpanded = true;
                });
            }
        });
    }

    private isActive(node: ModuleDefinition) {
        if (this.isModuleActive) {
            return this.isModuleActive(node, this._routerUrl);
        }
        let state = this.routerService.getState(node.routeName),
            state2 = this.routerService.getState(this._routerUrl) || '';
        return state2.indexOf(state) === 0;
    }

    private collapse() {
        this.travelMenu((node) => {
            node.isExpanded = false;
        });
    }
}
