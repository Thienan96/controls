import {NgModule} from '@angular/core';
import {FlexLayoutModule} from '@angular/flex-layout';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material';
import {CommonModule} from '@angular/common';
import {ExpandableComponent} from './expandable/expandable.component';
import {ExpandableService} from './shared/expandable.service';
import {VirtualListModule} from '../virtual-list/virtual-list.module';
import {VirtualScrollerModule} from 'ngx-virtual-scroller';
import {ExpandableBoundaryLineComponent} from './expandable-boundary-line/expandable-boundary-line.component';
import {ExpandableDragDirective} from './shared/expandable-drag.directive';
import {ExpandableDropListDirective} from './shared/expandable-drop-list.directive';
import {ExpandableDropZoneComponent} from './expandable-drop-zone/expandable-drop-zone.component';
import {
    ExpandableItemComponent,
    ExpandableItemContentComponent,
    ExpandableItemHeaderComponent
} from './expandable-item/expandable-item.component';
import {VirtualScrollModule} from '../virtual-scroll/virtual-scroll.module';
import {ExpandableBaseComponent} from './expandable-base/expandable.base.component';


@NgModule({
    declarations: [
        ExpandableComponent,
        ExpandableBoundaryLineComponent,
        ExpandableDragDirective,
        ExpandableDropListDirective,
        ExpandableDropZoneComponent,
        ExpandableItemComponent,
        ExpandableItemHeaderComponent,
        ExpandableItemContentComponent,
        ExpandableBaseComponent
    ],
    exports: [
        ExpandableComponent,
        ExpandableBoundaryLineComponent,
        ExpandableDragDirective,
        ExpandableDropListDirective,
        ExpandableDropZoneComponent,
        ExpandableItemComponent,
        ExpandableItemHeaderComponent,
        ExpandableItemContentComponent,
        ExpandableBaseComponent
    ],
    imports: [
        CommonModule,
        FlexLayoutModule,
        MatIconModule,
        MatButtonModule,
        VirtualListModule,
        VirtualScrollerModule,
        VirtualScrollModule
    ],
    providers: [
        ExpandableService
    ]
})
export class ExpandableModule {
}
