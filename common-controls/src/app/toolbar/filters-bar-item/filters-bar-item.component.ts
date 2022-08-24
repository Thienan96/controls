import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    HostListener,
    Input,
    OnDestroy,
    OnInit,
    Output
} from '@angular/core';
import {FilterDefinition} from '../../shared/models/common.info';
import {ToolbarService} from '../shared/toolbar.service';
import {HelperService} from '../../core/services/helper.service';

@Component({
    selector: 'ntk-filters-bar-item',
    templateUrl: './filters-bar-item.component.html',
    styleUrls: ['./filters-bar-item.component.scss']
})
export class FiltersBarItemComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() public item: FilterDefinition;
    @Input() public shownFavorite: boolean;
    @Input() public outDateFormat: string;

    @Output() private remove = new EventEmitter();
    @Output() private loaded = new EventEmitter();
    @Output() private destroy = new EventEmitter();
    @Output() private favoriteToggled = new EventEmitter();
    @Output() private clicked = new EventEmitter();

    private isRemoved = false;

    @HostListener('click') onClicked() {
        this.clicked.emit(this.item);
    }

    get displayValue() {
        return this.toolbarService.getDisplayValue(this.item, this.outDateFormat);
    }

    constructor(public elementRef: ElementRef,
                private helperService: HelperService,
                private toolbarService: ToolbarService) {
    }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.loaded.emit(this.elementRef.nativeElement);
    }

    ngOnDestroy() {
        this.destroy.emit();
    }

    onRemoveClicked($event: Event) {
        // Stop event
        $event.stopImmediatePropagation();

        if (!this.isRemoved) {
            this.isRemoved = true;
            this.remove.emit(this.item);
        }
    }

    onTogglePinClicked(item: FilterDefinition, ev: MouseEvent) {
        ev.stopImmediatePropagation();
        this.favoriteToggled.emit(item);
    }
}
