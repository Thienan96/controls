import {Component, OnInit} from '@angular/core';

@Component({
    selector: 'ntk-demo-shuffle',
    templateUrl: './shuffle.component.html',
    styleUrls: ['./shuffle.component.scss']
})
export class ShuffleComponent implements OnInit {
    contacts = [];

    constructor() {
        this.contacts = this.getContacts();
    }

    ngOnInit() {

    }

    private getContacts() {
        return [{
            Name: 'Nguyen Van A',
            OfficePhone: '093212312312',
            MobilePhone: '331232321312',
            Email: 'lamsieuuqayfdws@gami.com',
            Language: 'Eng',
            LogoUrl: 'https://devx.netika.com/alpha/logo/58f91405-ec1f-401a-af42-ed27a9b24095/122d620e-8e8f-49d7-a343-fc7543d33812.jpg',
            Comment: 'a \nb \nc'
        }, {
            Name: 'Nguyen Van B',
            OfficePhone: '32432423423',
            MobilePhone: '23423423423423',
            Email: '23423423@23423432.com',
            Language: 'French',
            LogoUrl: 'https://devx.netika.com/alpha/logo/58f91405-ec1f-401a-af42-ed27a9b24095/122d620e-8e8f-49d7-a343-fc7543d33812.jpg'
        }, {
            Name: 'Nguyen Van C',
            OfficePhone: '093212312312'
        }, {
            Name: 'Nguyen Van D',
            OfficePhone: '2321',
            MobilePhone: '21312312',
            LogoUrl: 'https://devx.netika.com/alpha/logo/58f91405-ec1f-401a-af42-ed27a9b24095/122d620e-8e8f-49d7-a343-fc7543d33812.jpg'
        }, {
            Name: 'Nguyen Van E',
            Language: 'Eng'
        }, {
            Name: 'Nguyen Van F',
            OfficePhone: '32432423423',
            Language: 'French',
            LogoUrl: 'https://devx.netika.com/alpha/logo/58f91405-ec1f-401a-af42-ed27a9b24095/122d620e-8e8f-49d7-a343-fc7543d33812.jpg'
        }, {
            Name: 'Nguyen Van G',
            OfficePhone: '093212312312',
            MobilePhone: '331232321312',
            Email: 'lamsieuuqayfdws@gami.com',
            Language: 'Eng',
            LogoUrl: 'https://devx.netika.com/alpha/logo/58f91405-ec1f-401a-af42-ed27a9b24095/122d620e-8e8f-49d7-a343-fc7543d33812.jpg'
        }, {
            Name: 'Nguyen Van H',
            OfficePhone: '32432423423',
            MobilePhone: '23423423423423',
            Email: '23423423@23423432.com',
            Language: 'French',
            LogoUrl: 'https://devx.netika.com/alpha/logo/58f91405-ec1f-401a-af42-ed27a9b24095/122d620e-8e8f-49d7-a343-fc7543d33812.jpg'
        }, {
            Name: 'Nguyen Van I',
            OfficePhone: '093212312312'
        }, {
            Name: 'Nguyen Van J',
            OfficePhone: '2321',
            MobilePhone: '21312312',
            LogoUrl: 'https://devx.netika.com/alpha/logo/58f91405-ec1f-401a-af42-ed27a9b24095/122d620e-8e8f-49d7-a343-fc7543d33812.jpg'
        }, {
            Name: 'Nguyen Van K',
            Language: 'Eng'
        }, {
            Name: 'Nguyen Van L',
            OfficePhone: '32432423423',
            Language: 'French',
            LogoUrl: 'https://devx.netika.com/alpha/logo/58f91405-ec1f-401a-af42-ed27a9b24095/122d620e-8e8f-49d7-a343-fc7543d33812.jpg'
        }];
    }
}
