import {Component} from '@angular/core';

@Component({
    selector: 'demo-duration',
    templateUrl: './duration.component.html'
})
export class DemoDurationComponent {
    start = '08:30';
    end = '11:15';
    disabled=false;

    onChangeDisable(ev) {
        this.disabled = ev.checked;
    }
}
