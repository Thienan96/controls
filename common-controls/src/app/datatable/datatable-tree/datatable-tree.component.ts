import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ContentChild,
    EventEmitter,
    Input,
    NgZone,
    OnDestroy,
    Output,
    TemplateRef
} from '@angular/core';
import {DatatableRow} from '../shared/datatable.model';
import {DatatableService} from '../shared/datatable.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'ntk-datatable-tree',
    templateUrl: './datatable-tree.component.html',
    styleUrls: ['./datatable-tree.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DatatableTreeComponent implements OnDestroy {
    private subExpandCollapseChanged: Subscription;

    @Input() row: DatatableRow;
    @Input() treeNodePaddingIndent = 24;
    @Output() expandedChange = new EventEmitter();
    @ContentChild(TemplateRef, {static: false}) template: TemplateRef<any>;

    /**
     *
     */
    constructor(private cd: ChangeDetectorRef,
                private datatableService: DatatableService,
                private zone: NgZone) {

        this.subExpandCollapseChanged = this.datatableService.onExpandCollapseChanged().subscribe(() => {
            console.log('----onExpandCollapseChanged');
            this.safeApply();
        });
    }

    ngOnDestroy(): void {
        this.subExpandCollapseChanged.unsubscribe();
    }

    private safeApply() {
        try {
            this.cd.detectChanges();
        } catch (error) {
        }
    }


    onToggleButtonClick() {
        this.zone.run(() => {
            this.row.expanded = !this.row.expanded;
            this.expandedChange.emit(this.row);
        });
    }

}
