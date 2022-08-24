import {AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output} from '@angular/core';
import {CustomFilter, FilterDefinition} from '../../shared/models/common.info';
import {ToolbarService} from '../shared/toolbar.service';

@Component({
    selector: 'ntk-custom-filter-item',
    templateUrl: './custom-filter-item.component.html',
    styleUrls: ['./custom-filter-item.component.scss']
})
export class CustomFilterItemComponent implements AfterViewInit, OnDestroy {
    @Input() item: CustomFilter;
    @Input() availableFilters: FilterDefinition[] = [];
    // EJ4-1486
    @Input() public canManageGlobalFilters = false;

    // NBSHD-4134
    @Input() showCustomFiltersCount: boolean;

    @Output() removed = new EventEmitter();
    @Output() clicked = new EventEmitter();
    @Output() loaded = new EventEmitter();
    @Output() destroy = new EventEmitter();
    @Output() pinToggled = new EventEmitter();


    constructor(public elementRef: ElementRef,
                private toolbarService: ToolbarService) {
    }

    ngAfterViewInit() {
        this.loaded.emit();
    }

    ngOnDestroy() {
        this.destroy.emit();
    }

    onButtonTogglePinClicked(ev: MouseEvent) {
        ev.stopImmediatePropagation();
        // We only allow change the pin status when not public filter or not pinned filter
        if (!this.item.Public || !this.item.MustPinned) {
            this.pinToggled.emit(this.item);
        }
        this.toolbarService.raiseRefreshCustomFiltersCount();
    }

    onButtonRemoveClicked(ev: MouseEvent) {
        ev.stopImmediatePropagation();

        this.removed.emit(this.item);
    }

    onCustomFilterClicked() {
        this.clicked.emit(this.item);
    }


}
