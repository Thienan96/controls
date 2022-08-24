import { AfterViewInit, Component, Inject, Injectable, ViewChild, Output, EventEmitter, ContentChild, TemplateRef, Input, ElementRef } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable, BehaviorSubject, merge, Subject } from 'rxjs';
import { ScrollDispatcher, CdkScrollable } from '@angular/cdk/scrolling';
import { FlatTreeControl } from '@angular/cdk/tree';
import { CollectionViewer, SelectionChange } from '@angular/cdk/collections';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import * as _ from 'underscore';
import { TranslationService } from '../core/services/translation.service';


export class DynamicFlatNode {
    constructor( public item: any, public index: number, public level = 1, public expandable = false,
                 public isLoading = false) {}
  }

export class DynamicDataSource {

  dataChange = new BehaviorSubject<DynamicFlatNode[]>([]);

  get data(): DynamicFlatNode[] { return this.dataChange.value; }
  set data(value: DynamicFlatNode[]) {
    this.treeControl.dataNodes = value;
    this.dataChange.next(value);
  }

  constructor(private treeControl: FlatTreeControl<DynamicFlatNode>,
              private getData: (parent?: any) => Observable<any[]>,
              private isExpandable: (item: any) => boolean ) {}

  connect(collectionViewer: CollectionViewer): Observable<DynamicFlatNode[]> {
    this.treeControl.expansionModel.changed.subscribe(change => {
      if ((change as SelectionChange<DynamicFlatNode>).added ||
        (change as SelectionChange<DynamicFlatNode>).removed) {
        this.handleTreeControl(change as SelectionChange<DynamicFlatNode>);
      }
    });

    return merge(collectionViewer.viewChange, this.dataChange).pipe(map(() => this.data));
  }

  /** Handle expand/collapse behaviors */
  handleTreeControl(change: SelectionChange<DynamicFlatNode>) {
    if (change.added) {
      change.added.forEach(node => this.toggleNode(node, true));
    }
    if (change.removed) {
      change.removed.slice().reverse().forEach(node => this.toggleNode(node, false));
    }
  }

    public reIndexNodes() {
        for (let i = 0; i < this.data.length ; i++ ) {
            this.data[i].index = i;
        }
    }

  /**
   * Toggle the node, remove from display list
   */
  toggleNode(node: DynamicFlatNode, expand: boolean) {

    const index = this.data.indexOf(node);
    if (expand) {
        node.isLoading = true;
        this.getData(node).subscribe((result) => {
            // console.log('expand get childs:', result);
            if (!result || result.length === 0) { return; }

            const nodes = result.map(item =>
                new DynamicFlatNode(item, index, node.level + 1, this.isExpandable(item)));

            this.data.splice(index + 1, 0, ...nodes);

            // console.log('result data:', this.data);

            node.isLoading = false;
            this.dataChange.next(this.data);
            this.reIndexNodes();

        }, (err) => {
            node.isLoading = false;
        });
    } else {
        let count = 0;
        for (let i = index + 1; i < this.data.length
            && this.data[i].level > node.level; i++, count++) {}
        this.data.splice(index + 1, count);

        this.dataChange.next(this.data);
        this.reIndexNodes();
    }
  }
}

export class TreeDropdownCallback {
    getData: (parent?: any) => Observable<any[]>;
}

@Component({
    selector: 'ntk-mat-dropdown-panel',
    templateUrl: './tree-panel.component.html',
    styleUrls: ['./tree-panel.component.scss']
})
export class TreePanelComponent implements AfterViewInit {
    @Output() _onClickSelect = new EventEmitter<any>();
    @ViewChild('inputQuery', { static: false }) inputQuery: ElementRef;

    treeControl: FlatTreeControl<DynamicFlatNode>;
    dataSource: DynamicDataSource;

    selectedIndex = -1;
    selectedItem: any;
    noData: boolean; // show text "No data to display"

    @Input() noDataText = 'No data to display';
    titleKey: string;
    itemTemplate: TemplateRef<any>;
    groupItemTemplate: TemplateRef<any>;
    _cacheMiddleLines: { [index: number]: boolean[] } = {};

    isShowSearch: boolean;
    isSmallScreen: boolean;
    searchText: string;
    onSearchTextChange = new Subject<string>();


    @ViewChild(CdkScrollable, {static: false}) scrollable: CdkScrollable;

    @Output('nodeToogle') nodeToogle = new EventEmitter<any>();
    @Output() closePanel = new EventEmitter();
    @Output() _onSearchChanged = new EventEmitter<any>();

    @ContentChild(TemplateRef, { static: false }) _itemTemplate: TemplateRef<any>;

    getLevel = (node: DynamicFlatNode) => node.level;

    isExpandable = (node: DynamicFlatNode) => node.expandable;

    hasChild = (_: number, _nodeData: DynamicFlatNode) => {
        // console.log('ash has child: ', _nodeData);
        return _nodeData.expandable;
    }

    isGroup = (_: number, _nodeData: DynamicFlatNode) => {
        // console.log('ask is group: ', _nodeData);
        return _nodeData.item.isGroup;
    }
    ngAfterViewInit(): void {
        // console.log('try scroll able:', this.scrollable);
        this.searchTextChange();
        this.initRootNodes();
    }

    private initRootNodes() {
        this._callBack.getData().subscribe((rootsItems) => {
            // console.log('root nodes:', rootsItems);
            this.dataSource.data = rootsItems.map(item => new DynamicFlatNode(item, -1, item.Level, item.isExpandable));

            // Fix problem prevent sometime display text or not (problem onAfterViewInit of Angular?)
            setTimeout(() => {
                this.noData = (this.dataSource.data || []).length === 0;
            }, 100);
            this.dataSource.reIndexNodes();
        });
    }

    constructor(public scroll: ScrollDispatcher, @Inject(MAT_DIALOG_DATA) private _callBack: TreeDropdownCallback, i18n: TranslationService) {

        this.treeControl = new FlatTreeControl<DynamicFlatNode>(this.getLevel, this.isExpandable);
        this.dataSource = new DynamicDataSource(this.treeControl,
            (parent: DynamicFlatNode) => {
                return this._callBack.getData(parent.item);
            },
            (item: any) => {
                return item.isExpandable;
            });

        this.treeControl.expansionModel.changed.subscribe(change => {
            if ((change as SelectionChange<DynamicFlatNode>).added ||
                (change as SelectionChange<DynamicFlatNode>).removed) {

                if (change.added) {
                    change.added.forEach(node => this.nodeToogle.emit(node.item));
                }
                if (change.removed) {
                    change.removed.forEach(node => this.nodeToogle.emit(node.item));
                }

            }});

        if (i18n.isExistsTranslation('lbNoDataToDisplay')) {
            this.noDataText = i18n.getTranslation('lbNoDataToDisplay');
        }
    }

    refresh() {
        this.dataSource.data.splice(0, this.dataSource.data.length);
        setTimeout(() => {
            this.initRootNodes();
        }, 200);
    }

    onNodeClick(node: DynamicFlatNode) {
        this.selectedIndex = node.index;
        this.selectedItem = node.item;

        this._onClickSelect.emit(this.selectedItem);
    }

    expandSelectedRow() {
        this.treeControl.expand(this.treeControl.dataNodes[this.selectedIndex]);
    }

    collapseSelectedRow() {
        this.treeControl.collapse(this.treeControl.dataNodes[this.selectedIndex]);
    }

    selectNextItem(offset: number) {
        if (this.selectedIndex < 0 && offset < 0) { return; }

        if (this.selectedIndex < 0 && offset > 0) {
            this.selectedIndex = 0;
        } else {
            this.selectedIndex += offset;
        }

        let totalItems = this.dataSource.data.length;

        // make sure it does go exceed the count
        if (this.selectedIndex >= totalItems) {
            this.selectedIndex = totalItems - 1;
        }

        if (this.selectedIndex >= 0 && this.dataSource.data) {
            this.selectedItem = this.dataSource.data[this.selectedIndex].item;
        }

        if (this.selectedIndex >= 0 && this.scrollable) {
            let scrollOffsetFromTop = this.scrollable.measureScrollOffset('top');
            // console.log('scrollOffsetFromTop=', scrollOffsetFromTop);
            // console.log('getElementRef=', this.scrollable.getElementRef());

            let itemSize = 48;
            let viewPort = this.scrollable.getElementRef();
            let viewPortSize = viewPort.nativeElement.clientHeight;

            //this.scrollable.scrollTo()



            //let viewPortSize =  this._viewport.getViewportSize();
            let measureScrollOffset = this.scrollable.measureScrollOffset('top');

            // console.log('measureScrollOffset=', measureScrollOffset);


            let startIndex = Math.round(measureScrollOffset / itemSize);
            // console.log('startIndex=', startIndex);
            let endIndex = Math.round(viewPortSize / itemSize) + startIndex - 1;
            // console.log('endIndex=', endIndex);

            // console.log('selected index=', this.selectedIndex);


            if (this.selectedIndex > endIndex) {
                 // this.scrollable.scrollToIndex(startIndex + (this.selectedIndex - endIndex));
                 let scrollTo = ((this.selectedIndex + 1) * itemSize - viewPortSize);
                //  console.log('scroll to botton at:', scrollTo);

                 this.scrollable.scrollTo({top: scrollTo});
             } else if (this.selectedIndex < startIndex) {
        //         this._viewport.scrollToIndex(this.selectedIndex);
                let topTo = this.selectedIndex * itemSize;
                //  console.log('scroll to top at:', topTo);
                this.scrollable.scrollTo({top: topTo});
             }
        }
    }

    /**
     * This is to serve the gid which need display like a tree
     * The method return if the line is the fist line in its level
     * @param index : row index in list
     */
    isFirstItemInLevel(index: number): boolean {
        if (this.dataSource.data && index > 0) {
            let item = this.dataSource.data[index];
            let pre = this.dataSource.data[index - 1];
            if (item && pre) {
                return pre['level'] < item['level'];
            }
        }
        return index === 0;
    }

    /**
     * This is to serve the gid which need display like a tree
     * The method return an array of indent level which tru/false depend on if need to draw the line on that level or not
     * @param index : row index in list
     */
    calculateIndentLines(index: number): boolean[] {

        // if (this._cacheMiddleLines[index]) {
        //     return this._cacheMiddleLines[index];
        // }
        if (this.dataSource.data) {
            let item = this.dataSource.data[index];

            // in case the line not yet perofomr lazy load finish
            if (!_.has(item, 'level')) {
                return [];
            }

            let result: boolean[] = new Array(item['level'] > 0 ? item['level'] - 1 : 0).fill(false);

            // console.log('item =', item.Name, ' level=', item.Level);
            let lastLevel = item['level'];

            if (item['level'] > 1) {
                for (let i = +index + 1; i < this.dataSource.data.length; i++) {
                    if (this.dataSource.data[i]['level'] < lastLevel) {
                        if (this.dataSource.data[i]['level'] === 1) {
                            this._cacheMiddleLines[index] = result;
                            return result;
                        } else {
                            result[this.dataSource.data[i]['level'] - 2] = true;
                        }

                        lastLevel = this.dataSource.data[i]['level'];
                    }
                }
            }
            // console.log('return 2: ', result);
            this._cacheMiddleLines[index] = result;
            return result;
        }
        // this._cacheMiddleLinesNumber[index] = 0;
        return [];
    }

    close() {
        this.closePanel.emit();
    }

    enableSearch() {
        this.isShowSearch = true;
        if (this.isSmallScreen) {
            setTimeout(() => {
                this.inputQuery.nativeElement.focus();
            }, 200);
        }
    }

    disableSearch() {
        this.isShowSearch = false;
        this.clearQuery();
    }

    clearQuery() {
        this.searchText = '';
        this._onSearchChanged.emit('');
    }

    searchTextChange() {
        this.onSearchTextChange.pipe(
            debounceTime(500),
            distinctUntilChanged())
            .subscribe(value => {
                this._onSearchChanged.emit(value);
            });
    }

}
