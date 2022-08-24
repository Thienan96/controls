import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'ntk-demo-charts',
    templateUrl: './charts.component.html',
    styleUrls: ['./charts.component.scss']
})
export class ChartsComponent implements OnInit {
    
    public chartItems1;
    public chartItems2;
    public chartItems3;

    constructor() {
    
    }

    ngOnInit() {
        this.chartItems1 = [
            { percent: 0.1, color: 'Coral' },
            { percent: 0.65, color: 'CornflowerBlue' },
            { percent: 0.2, color: '#00ab6b' },
          ];

          this.chartItems2 = [
            { percent: 0.75, color: 'red' },
            { percent: 0.25, color: 'white' }
          ];

          this.chartItems3 = [
            { percent: 0.25, color: '#DEFF7C' },
            { percent: 0.75, color: '#FF5A51' },
          ];

    }

    onChangeData() {
        this.chartItems1 = [
            { percent: 0.43, color: 'Coral' },
            { percent: 0.57, color: '#00ab6b' },
          ];
    }

    
}
