import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from '../../../core/services/Api.service';
import {ExpandableComponent, IExpandableOption, CheckListItemWrapper} from '../../../expandable/public_api';


@Component({
    selector: 'ntk-demo-lines-detail',
    templateUrl: './lines-detail.component.html',
    styleUrls: ['./lines-detail.component.scss']
})
export class LineDetailsComponent implements OnInit {
    items: any[] = [];
    options: IExpandableOption = {
        itemHeight: 49,
        indent: 32
    };
    parentCheckListBase = {
        Id: '876de6c1-e453-4974-b3cd-ef2e8014e7d2',
        EntityType: 'CheckListTemplate',
        Name: '111'
    };
    isConnectServer = false;

    @ViewChild(ExpandableComponent, {static: false}) virtualList: ExpandableComponent;

    constructor(private apiService: ApiService) {
    }

    ngOnInit() {
        let url = `src/assets/data/lines-detail.json`;
        if (this.isConnectServer) {
            url = `CheckListDetail/GetCheckListBaseItems?checkListBaseId=${this.parentCheckListBase.Id}`;
        }
        this.apiService.get(url).subscribe((data: any) => {
            this.items = data;
            this.items.forEach((line) => {
                line.Content = `Thống kê của Bệnh viện Đa khoa Bình Thuận, đã có khoảng 300 bệnh nhân và 200 người nuôi bệnh trốn về nhà. "Theo dự kiến, sáng 2/7, họ mới được về, nhưng do quá nôn nóng, bà con đã kéo nhau vượt rào", bác sĩ Nguyễn Văn Thành, Giám đốc bệnh viện cho biết.;`;
            });
            setTimeout(() => {
                this.virtualList.refreshList();
            }, 100);
        });
    }

    onToggleButtonClick(item: CheckListItemWrapper, ev: MouseEvent) {
        ev.stopImmediatePropagation();
        this.virtualList.toggle(item);
    }

    toggleSelectLine(item: CheckListItemWrapper) {
        if (!item.isConditionalGroupItem) {
            this.virtualList.toggleSelectLine(item, !item.isSelected);
        }
    }

}
