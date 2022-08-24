import { Component, OnChanges, SimpleChanges, Input, ElementRef, ViewChild } from '@angular/core';

@Component({
    selector: 'ntk-pie-chart',
    templateUrl: './pie-chart.component.html',
    styleUrls: ['./pie-chart.component.scss']
})
export class PieChartComponent implements OnChanges {

    @Input() chartItems = [];
    
   
    @ViewChild('svg', {static: false}) private svg: ElementRef;
    
    
    ngOnChanges(changes: SimpleChanges): void {
        if (!!changes['chartItems']) {
            setTimeout(() => {
                this.refresh();
            }, 10);
        }
    }

    private refresh() {
        
        if (!this.svg || !this.chartItems) return;

        let svgEl = this.svg.nativeElement;

        if(!svgEl) return;
        
        svgEl.innerHTML = '';
        
        let cumulativePercent = 0;

        this.chartItems.forEach(slice => {
            // destructuring assignment sets the two variables at once
            const [startX, startY] = this.getCoordinatesForPercent(cumulativePercent);
            
            // each slice starts where the last slice ended, so keep a cumulative percent
            cumulativePercent += slice.percent;
            
            const [endX, endY] = this.getCoordinatesForPercent(cumulativePercent);
            
            // if the slice is more than 50%, take the large arc (the long way around)
            const largeArcFlag = slice.percent > .5 ? 1 : 0;
            
                // create an array and join it just for code readability
            const pathData = [
                `M ${startX} ${startY}`, // Move
                `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, // Arc
                `L 0 0`, // Line
            ].join(' ');
            
            // create a <path> and append it to the <svg> element
            const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathEl.setAttribute('d', pathData);
            pathEl.setAttribute('fill', slice.color);
            svgEl.appendChild(pathEl);
        });
    }

    private getCoordinatesForPercent(percent): any {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    }

}