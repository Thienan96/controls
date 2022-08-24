import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {
    ResourcePlanningConfig,
    IResourcePlanningHeaderColumn,
    ResourcePlanningViewMode
} from '../shared/resource-planning.model';
import {ResourcePlanningService} from '../shared/resource-planning.service';

@Component({
    selector: 'ntk-resource-planning-lines',
    templateUrl: './resource-planning-lines.component.html',
    styleUrls: ['./resource-planning-lines.component.scss']
})
export class ResourcePlanningLinesComponent implements OnInit, OnChanges {
    @Input() options: ResourcePlanningConfig;
    @Input() dates: string[];
    @Input() viewMode: ResourcePlanningViewMode;
    @Input() daysOfWeek: number;
    datesPosition: IResourcePlanningHeaderColumn[] = [];

    constructor(private resourcePlanningService: ResourcePlanningService) {
    }

    get ViewMode() {
        return ResourcePlanningViewMode;
    }

    ngOnInit() {
        this.updateDates();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes.daysOfWeek && !changes.daysOfWeek.isFirstChange()) {
            this.daysOfWeek = changes.daysOfWeek.currentValue;
            this.updateDates();
        }

        if (changes.dates && !changes.dates.isFirstChange() ||
            (changes.viewMode && !changes.viewMode.isFirstChange())) {
            this.updateDates();
        }
    }

    /**
     * Update position of dates
     */
    private updateDates() {
        this.datesPosition = this.resourcePlanningService.getDatesPosition(this.dates, this.viewMode, this.daysOfWeek);
    }

}
