import {Component} from '@angular/core';


@Component({
    selector: 'ntk-demo-xxs',
    templateUrl: './xxs.component.html',
    styleUrls: ['./xxs.component.scss']
})
export class XxsComponent {

    public xssText = `Long text Long text Long text Long text Long text Long text Long text Long text Long text 
    Long text Long text Long text Long text Long text Long text Long text Long text Long text Long text Long text 
    \r\nHello\r\nthis is <script>alert("test");</script>\nend.`;

}
