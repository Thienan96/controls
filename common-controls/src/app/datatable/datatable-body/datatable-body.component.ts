import {
    AfterViewInit, ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Inject,
    Injector,
    Input,
    NgZone,
    OnDestroy,
    Output,
    QueryList,
    TemplateRef,
    ViewChildren
} from '@angular/core';
import {DatatableColumn, DatatableComponentInterface, DatatableRow, NTK_DATATABLE} from '../shared/datatable.model';
import {Observable} from 'rxjs/Observable';
import {Subject, Subscription} from 'rxjs';
import {DatatableDataController} from '../shared/datatable-data.controller';
import {takeUntil} from 'rxjs/internal/operators/takeUntil';
import {TranslationService} from '../../core/services/translation.service';
import {DatatableRowComponent} from '../datatable-row/datatable-row.component';

@Component({
    selector: 'ntk-datatable-body',
    templateUrl: './datatable-body.component.html',
    styleUrls: ['./datatable-body.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatatableBodyComponent extends DatatableDataController<DatatableRow> implements AfterViewInit, OnDestroy {
    @ViewChildren(DatatableRowComponent) rowComponents: QueryList<DatatableRowComponent>;
    @Input() columns: DatatableColumn[];
    @Input() getData: any;
    @Input() cellTemplate: TemplateRef<any>;
    @Input() scrollLeft: number;
    @Input() rowClass: any;
    @Input() itemHeight: number;
    @Input() rowTemplate: TemplateRef<any>;
    @Input() hasAlternate;

    @Input() noDataText = 'No data to display';

    @Output() fetchDataFinished = new EventEmitter();
    @Output() rowSelected = new EventEmitter();
    @Output() rowDbClick = new EventEmitter();

    @Output() rowClick = new EventEmitter<any>();

    dataChanged = new Subject();
    // raise event whenever load done page
    raiseFinshed = new Subject();
    destroy$: Subject<boolean> = new Subject<boolean>();
    sub: Subscription;

    constructor(injector: Injector,
                private cd: ChangeDetectorRef,
                private ngZone: NgZone,
                @Inject(NTK_DATATABLE) private datatableComponent: DatatableComponentInterface) {
        super(injector);

        let i18n = injector.get(TranslationService);

        if (i18n.isExistsTranslation('lbNoDataToDisplay')) {
            this.noDataText = i18n.getTranslation('lbNoDataToDisplay');
        }
    }

    ngAfterViewInit() {
        if (this.virtualScroll) {
            this.virtualScroll.scrollAnimationTime = 0;
        }
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
        this.raiseFinshed.complete();
        this.destroy$.complete();
    }

    loadData(): Observable<any> {
        this.safeApply();
        return this.getData.apply(this, arguments);
    }

    onRowClick(row: DatatableRow) {
        if (row && row.Id !== -1 && !this.datatableComponent.isDisabledSelectionRow) {
            this.ngZone.run(() => {
                this.setSelectedItem(row);
                this.rowClick.emit(row);
            });
        }
    }

    onRowSelect(row: DatatableRow) {
        if (row && row.Id !== -1) {
            this.ngZone.run(() => {
                this.setSelectedItem(row);
            });
        }
    }


    onRowDbClick(row: DatatableRow) {
        if (row.Id !== -1) {
            this.ngZone.run(() => {
                this.rowDbClick.emit(row);
            });
        }
    }

    private safeApply() {
        try {
            this.cd.detectChanges();
        } catch {
        }
    }

    onFetchDataFinished() {
        this.raiseFinshed.next();
        this.safeApply();
        this.updateColumns();
        this.fetchDataFinished.emit();
    }


    updateColumns() {
        this.dataChanged.next();
    }


    onUpdate(event: any) {
        this.updateViewPortChanged(event);
        this.safeApply();
    }

    onChange(event: any) {
        this.onRequestItemsLoad(event);
    }

    scrollToIndex(index: number) {
        this.destroy$.next(true);
        this.virtualScroll.scrollToIndex(index);
        if (this.items[index] && this.items[index].Id !== -1) {
            this.onRowSelect(this.items[index]);
        } else {
            this.destroy$.next(true);
            this.sub = this.raiseFinshed
                .pipe(takeUntil(this.destroy$)).subscribe(() => {
                    this.onRowSelect(this.items[index]);
                    this.destroy$.next(false);
                });
        }
    }

    safeApplyChildren() {
        this.safeApply();
        this.rowComponents.forEach((row) => {
            row.safeApply();
        });
    }
}
