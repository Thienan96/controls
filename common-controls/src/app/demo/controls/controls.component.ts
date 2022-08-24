import {ToolbarService} from '../../toolbar/public_api';
import {AfterContentInit, AfterViewInit, Component, Injector, ViewChild} from '@angular/core';
import {
    BaseQueryCondition,
    CalendarDate,
    DialogService,
    ExistingInsertionsPerDate
} from '../../shared/common-controls-shared.module';
import {HelperService} from '../../core/services/helper.service';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {IDropdownGetDataEvent} from '../../dropdown/shared/dropdown.model';
import {Observable, of} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import moment from 'moment-es6';
import {NumericInputDirective} from '../../shared/directives/numeric-input.directive';
import {map} from 'rxjs/operators';


@Component({
    selector: 'ntk-controls',
    templateUrl: './controls.component.html',
    styleUrls: ['./controls.component.scss']
})
export class ControlsComponent implements AfterContentInit, AfterViewInit {

    @ViewChild('numberField', {static: false}) _numberField: NumericInputDirective;


    public currentFilter: BaseQueryCondition;

    status = '';

    private _dropdownData = [];

    private _preAppendData = [];


    getDropdownData: any;
    getEmtpyData: any;
    getData1: any;

    getFewData: any;

    dropdownValue: any;

    selectedRoom: any;

    dateValue: Date = new Date(2019, 7, 16);

    dateField = new FormControl('');

    datetimePickerValue = new FormControl('');

    minDate = new Date(2019, 1, 1);

    private emptyCallCount = 0;


    showStandardControls = true;
    showEquipmentTypeGrid = false;
    showPipes = false;

    isRequired = false;

    fixedDate: Date;

    fixedDate2: Date;



    testNumber = 15404.67;

    testNumberWithPercentage: string = '35%';

    // test year calendar
    yearCalendar: number = 2020;
    selectedInsertionsDates: Date[] = [];
    existingInsertionsPerDate: ExistingInsertionsPerDate[] = [];
    selectedDates: CalendarDate[];

    public taskAssignmentForm: FormGroup;

    public saleForm: FormGroup;


    allItems: string[] = [];
    existingItems: string[] = [];

    public UnitSalesPrice = 120;
    public Quantity = 2;
    public SalesPrice = 2;

    public longText = 'Long text not trunc Long text not trunc Long text not trunc Long text not trunc Long text not trunc Long text not trunc Long text not trunc Long text not trunc Long text not trunc Long text not trunc\nnew line';

    constructor(private injector: Injector, private toolbarSvc: ToolbarService
        , private _dlg: DialogService
        , private _http: HttpClient, private _formBuild: FormBuilder) {

        // test year calendar
        this.selectedInsertionsDates = [moment().toDate(), moment('15/10/2020', 'DD/MM/YYYY').toDate()];
        this.existingInsertionsPerDate.push({
            Date: moment('15/05/2020', 'DD/MM/YYYY').toDate(),
            NbrInsertions: 1,
            DetailPerTitle: [{Title: 'title A', NbrInsertions: 1}]
        });
        this.existingInsertionsPerDate.push({
            Date: moment('15/06/2020', 'DD/MM/YYYY').toDate(),
            NbrInsertions: 2,
            DetailPerTitle: [{Title: 'title A', NbrInsertions: 1}, {Title: 'title B', NbrInsertions: 1}]
        });
        this.existingInsertionsPerDate.push({
            Date: moment('20/10/2020', 'DD/MM/YYYY').toDate(),
            NbrInsertions: 3,
            DetailPerTitle: [{Title: 'title A', NbrInsertions: 2}, {Title: 'title B', NbrInsertions: 1}]
        });
        this.selectedDates = [];
        this.getData1 = this._getData1.bind(this);

        this.fixedDate = moment('2020-12-16T23:00:00Z').toDate();

        this.fixedDate2 = moment('2020-12-16T00:00:00Z').toDate();


        this.taskAssignmentForm = _formBuild.group({
            Id: [{value: undefined, disabled: true}],
            Workload: [{value: undefined, disabled: false}],
            PlannedStartTime: [{value: undefined, disabled: false}],
            PlannedStartTimeNumber: [{value: undefined, disabled: false}]
        });

        let testObject = {
            Workload: 1,
            PlannedStartTime: '11:15',
            PlannedStartTimeNumber: 9.25
        };

        this.taskAssignmentForm.patchValue(testObject, {emitEvent: false});


        this.saleForm = _formBuild.group({
            Id: [{value: undefined, disabled: true}],
            UnitPrice: [{value: undefined, disabled: false}],
            DiscountValue: [{value: undefined, disabled: false}],
            UnitSalesPrice: [{value: undefined, disabled: false}],
            Quantity: [{value: undefined, disabled: false}],
            SalesPrice: [{value: undefined, disabled: false}]
        });

        let testLine = {
            UnitPrice: 100,
            DiscountValue: {Value: 10, IsPercent: true},
            UnitSalesPrice: 90,
            Quantity: 1,
            SalesPrice: 90
        };

        this.saleForm.get('UnitPrice').valueChanges.subscribe((v) => {
            this.onUnitPriceChanged();
        });

        this.saleForm.get('DiscountValue').valueChanges.subscribe((v) => {
            this.onDiscountValueChanged();
        });


        this.saleForm.get('UnitSalesPrice').valueChanges.subscribe((v) => {
            this.onUnitSalesPriceChanged();
        });

        this.saleForm.get('Quantity').valueChanges.subscribe((v) => {
            this.onQuantityChanged();
        });

        this.saleForm.get('SalesPrice').valueChanges.subscribe((v) => {
            this.onSalesPriceChanged();
        });

        this.saleForm.patchValue(testLine, {emitEvent: false});


        this.allItems.push(...['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten']);
        this.existingItems.push(...['Three', 'Six', 'Eight', 'Ten']);


    }



    onUnitSalesPriceValueChanged($event) {
        let helper = this.injector.get(HelperService);
        this.SalesPrice = helper.UtilityService.multiply(this.Quantity, this.UnitSalesPrice, 2);
    }

    onQuantityValueChanged($event) {
        let helper = this.injector.get(HelperService);
        this.SalesPrice = helper.UtilityService.multiply(this.Quantity, this.UnitSalesPrice, 2);
    }

    onSalesPriceValueChanged($event) {
        let helper = this.injector.get(HelperService);
        this.UnitSalesPrice = helper.UtilityService.divided(this.SalesPrice, this.Quantity, 5);
    }


    private onUnitPriceChanged() {
        this.updateUnitSalesPrice();
        this.updateSalesPrice();
    }

    private onDiscountValueChanged() {
        this.updateUnitSalesPrice();
        this.updateSalesPrice();
    }

    private updateUnitSalesPrice() {
        let helper = this.injector.get(HelperService);
        let unitPrice = this.saleForm.get('UnitPrice').value;
        let discountValue = this.saleForm.get('DiscountValue').value;
        if (discountValue) {
            let unitSalesPrice: number = 0;
            if (discountValue.IsPercent) {
                unitSalesPrice = helper.UtilityService.minus(unitPrice, unitPrice * discountValue.Value / 100, 5);
            } else {
                unitSalesPrice = helper.UtilityService.minus(unitPrice, discountValue.Value, 5);
            }
            this.saleForm.get('UnitSalesPrice').patchValue(unitSalesPrice, {emitEvent: false});
        }
    }

    private updateUnitPrice() {
        let helper = this.injector.get(HelperService);
        let discountValue = this.saleForm.get('DiscountValue').value;
        let unitSalesPrice = this.saleForm.get('UnitSalesPrice').value;
        if (discountValue) {
            let unitPrice: number = 0;
            if (discountValue.IsPercent) {
                if (discountValue.Value !== 100) {
                    unitPrice = helper.UtilityService.divided(helper.UtilityService.multiply(100, unitSalesPrice)
                        , helper.UtilityService.minus(100, discountValue.Value), 5);
                } else {
                    unitPrice = 0;
                }
            } else {
                unitPrice = helper.UtilityService.plus(unitSalesPrice, discountValue.Value, 5);
            }
            this.saleForm.get('UnitPrice').patchValue(unitPrice, {emitEvent: false});

        }
    }


    private onUnitSalesPriceChanged() {
        this.updateUnitPrice();
        this.updateSalesPrice();
    }

    private onQuantityChanged() {
        this.updateSalesPrice();
    }

    private updateSalesPrice() {
        let helper = this.injector.get(HelperService);
        let quantity = this.saleForm.get('Quantity').value;
        let unitSalesPrice = this.saleForm.get('UnitSalesPrice').value;
        let salesPrice = helper.UtilityService.multiply(quantity, unitSalesPrice, 2);

        this.saleForm.get('SalesPrice').patchValue(salesPrice, {emitEvent: false});

    }

    private onSalesPriceChanged() {
        let helper = this.injector.get(HelperService);
        let quantity = this.saleForm.get('Quantity').value;
        let salesPrice = this.saleForm.get('SalesPrice').value;

        if (quantity !== 0) {
            let unitSalesPrice = helper.UtilityService.divided(salesPrice, quantity, 5);
            this.saleForm.get('UnitSalesPrice').patchValue(unitSalesPrice, {emitEvent: false});
            this.updateUnitPrice();

        }

    }

    onMentionFilter(searchString, items: any[]) {
        items = items.filter((item: any) => !item.Id || item.Name.toLowerCase().indexOf(searchString.toLowerCase()) !== -1);
        items = items.reduceRight((prev, curr) => {
            if (curr.Id || (!curr.Id && prev.length > 0 && prev[0].Id)) {
                prev.unshift(curr);
            }
            return prev;
        }, []);
        return items;
    }


    ngAfterViewInit(): void {


        this.refreshEquipmentTypeGrid();
    }

    ngAfterContentInit(): void {

        for (let i = 0; i < 4; i++) {
            this._preAppendData.push({
                Id: 'pre-' + i,
                Name: 'Pre item ' + i
            });
        }

        for (let i = 0; i < 1000; i++) {
            this._dropdownData.push({
                Id: 'code-' + i,
                Name: 'Item number ' + i
            });

            if (i === 5) {
                this._dropdownData[i].Name += 'this is a very logn text to tes the text truncation system with tooltip';
            }
        }

        this.dropdownValue = this._dropdownData[10];
        this.getDropdownData = this._getDropdownData.bind(this);


        this.getEmtpyData = (startIndex: number, pageSize: number, searchText: string) => {

            if (startIndex === 0) {
                this.emptyCallCount++;
            }
            // console.log('call getEmtpyData this.dropdownValue=', this.dropdownValue);

            if (this.emptyCallCount <= 3) {
                return of({ListItems: null, Count: 0});
            } else {
                return new Observable((sub) => {
                    setTimeout(() => {
                        let data = this._dropdownData.slice(startIndex, startIndex + pageSize);
                        // console.log('return data: ', data);

                        sub.next({ListItems: data, Count: this._dropdownData.length});
                        sub.complete();
                    }, 500);
                });

                //let data = this._dropdownData.slice(startIndex, startIndex + pageSize);
                //return of({ ListItems: data, Count: this._dropdownData.length });
            }

        };

        this.getFewData = (startIndex: number, pageSize: number, searchText: string) => {
            let c = 2;
            let data = this._dropdownData.slice(startIndex, c);

            if (startIndex === 0) {
                return new Observable((sub) => {
                    setTimeout(() => {
                        sub.next({ListItems: data, Count: c});
                        sub.complete();
                    }, 500);
                });
            } else {
                return of({ListItems: data});
            }
        };
    }

    getErrorMessage() {

        // console.log('getErrorMessage : ', this.dateField.errors);

        let err = '';
        if (this.dateField.hasError('required')) {
            err = 'You must enter a value';
        } else if (this.dateField.hasError('matDatepickerParse')) {
            err = 'Invalid input';
        }

        return err;
    }


    testDisabled = false;

    onTestClick() {
        let helper = this.injector.get(HelperService);
        this.dropdownValue = this._dropdownData[10];


        let a = undefined;
        let undef = helper.UtilityService.transform('NaN', ',', '.', 2);
        console.log('result = ', JSON.stringify(undef));

        console.log('is nunmber = ', helper.UtilityService.isNumber(undef));
        console.log('NaN is nunmber = ', helper.UtilityService.isNumber(NaN));
        console.log('NaN,00 is nunmber = ', helper.UtilityService.isNumber('NaN,00'));
        console.log('S-00.00 is nunmber = ', helper.UtilityService.isNumber('00.00'));
        console.log('00.00 is nunmber = ', helper.UtilityService.isNumber(0.00));
        console.log('undefined is nunmber = ', helper.UtilityService.isNumber(undefined));
        console.log('empty is nunmber = ', helper.UtilityService.isNumber(''));

        helper.DialogService.showToastMessage('Test message');
        helper.DialogService.showErrorToastMessage('An unexpected error \'Invalid\' has occurred. An unexpected error \'Invalid\' has occurred.');

        // let client = helper.StorageService.getValue(StorageKeys.ClientId, StorageLocation.Local);
        // let user = helper.StorageService.getValue(StorageKeys.UserLanguage, StorageLocation.Local);

        // helper.DialogService.showErrorToastMessage('error toast message for test');
        // helper.DialogService.showWarningToastMessage('warning toast message for test');
        // helper.DialogService.showToastMessage('toast message for test');

        // console.log('1 - get client after save: ', client);
        // console.log('1 - get user after save: ', user);

        // let objTosave = { 'foo': 'bar' };

        // let languageCode = 'eng';
        // setTimeout(() => {
        //   helper.StorageService.setLocalValue(StorageKeys.UserLanguage, languageCode);
        // }, 200);

        // //helper.StorageService.setLocalValue(StorageKeys.ClientId, '1234');

        // setTimeout(() => {
        //   helper.StorageService.setLocalValue(StorageKeys.ClientId, objTosave);
        // }, 200);


        // for (let i = 0 ; i < 100; i++ ) {
        //   setTimeout(() => {
        //     helper.StorageService.setSessionValue(StorageKeys.ClientId, objTosave);
        //   }, 0);
        // }

        // setTimeout(() => {
        //   let client = helper.StorageService.getValue(StorageKeys.ClientId, StorageLocation.Local);
        //   let user = helper.StorageService.getValue(StorageKeys.UserLanguage, StorageLocation.Local);

        //   console.log('get client after save: ', client);
        //   console.log('get user after save: ', user);
        // }, 1000);


        //    this.status = JSON.stringify(getObj);

        // if (this.prekey) {
        //   this.prekey = undefined;
        // } else {
        //   this.prekey = 'Changed';
        // }

        //let title = 'Test dialog multiple line';
        //let message = 'No incident manager is defined for this incident. To send this email, a contact must be specified.  <br/>Do you want to be assigned as the manager of the incident?';
        // let message = 'No incident manager is defined for this incident. To send this email, a contact must be specified.  Do you want to be assigned as the manager of the incident?';
        // this._dlg.showMessageDialog('title', message, 'btYesNo').subscribe((result) => {
        // });


        // let matDialogRef = this.injector.get(MatDialogRef, null);

        // let docWrapper = {
        //   //Document: { Name: 'No incident manager is defined for this incident. To send this email, a contact must be specified.'}
        //   Document: { Name: 'this is title'}
        // }


        // this._dlg.openSlideDialog(matDialogRef, ViewDocumentDialog, { document: docWrapper, canDraw: false }
        //   , '500px', '90vh', false).subscribe(x => {
        //       console.log('closed: ', x);
        //       //this.model.DocumentWrapper.HasDrawing = this.model.DocumentWrapper.Shapes && this.model.DocumentWrapper.Shapes.length > 0;
        //   });

        // this._dlg.openDialog(AttachDocumentsDialog, { siteId: 'd42f8f86-d86b-4da4-8040-29991faa85bb', withRooms: false }, '1280px', '90vh'
        // , true, false, undefined, '1000px').subscribe(_result => {

        // });
    }

    setStatus(text: string) {
        this.status = text;

        setTimeout(() => {
            this.status = '';
        }, 2000);
    }

    public getRooms(searchText: string, parent?: any): Observable<any[]> {

        console.log('get room, parent = ', parent);

        let result = [];

        for (let i = 0; i < 10; i++) {
            result.push({
                Id: parent ? `${parent.Id}_${i}` : `${i}`,
                Name: parent ? `Item ${parent.Name}_${i}` : `Item ${i}`,
                Type: 'type',
                isExpandable: true,
                isGroup: false,
                Level: (parent ? parent.Levvel + 1 : 0) + 1
            });
        }

        result[0].Name = 'This is a very long name of the room. This is a very long name of the room. This is a very long name of the room. This is a very long name of the room. This is a very long name of the room. ';

        let finalResult = result;
        if (searchText) {
            finalResult = result.filter(f => {
                return (f.Name + '').includes(searchText);
            });
        }


        return of(finalResult);
    }

    onWaitClick() {
        let sub = this._http.get('testWaitCall').subscribe(x => {
            console.log('testWaitCall return=', x);
            this.status += '-------' + x + '-----';
        });

        setTimeout(() => {
            sub.unsubscribe();
        }, 200);
    }


    _getDropdownData(startIndex: number, pageSize: number, searchText: string): Observable<any> {
        console.log('getDropdownData startIndex=', startIndex, ' pageSize=', pageSize, ' searchText=', searchText);
        // return of( this._dropdownData.slice(startIndex, startIndex + pageSize));

        let data = this._dropdownData.slice(startIndex, startIndex + pageSize);

        if (startIndex === 0) {
            //return of({ ListItems: data, Count: this._dropdownData.length, AppendRows: this._preAppendData });
            return new Observable((sub) => {
                sub.next({ListItems: data, Count: this._dropdownData.length, AppendRows: this._preAppendData});
                sub.complete();

                // setTimeout(() => {
                //     sub.next({ ListItems: data, Count: this._dropdownData.length, AppendRows: this._preAppendData });
                //     sub.complete();
                // }, 100);
            });
        } else {
            // if (startIndex > 100) {
            //   return throwError('test error');
            // }
            return of({ListItems: data, Count: this._dropdownData.length});
        }
    }

    onGetDropdownData(event: IDropdownGetDataEvent) {

        // console.log('onGetDropdownData --- ', event.startIndex);


        this._getDropdownData(event.startIndex, event.pageSize, event.searchText).subscribe(x => {
            // console.log('onGetDropdownData result: ', x);

            event.callBack.next(x);
            event.callBack.complete();
        }, (err) => {
            event.callBack.error(err);
            event.callBack.complete();
        });
    }


    switchTestControlsTo(to: string) {

        this.showStandardControls = false;
        this.showEquipmentTypeGrid = false;
        this.showPipes = false;

        if (to === 'standard') {
            this.showStandardControls = true;
        } else if (to === 'equipment-type-grid') {
            this.showEquipmentTypeGrid = true;
        } else if (to === 'pipes') {
            this.showPipes = true;
        }
    }

    refreshEquipmentTypeGrid() {
    }

    testMessageYN() {
        this._dlg.showMessageDialog('This is title', 'This is message', 'btYesNo');
    }

    testMessageOK() {
        this._dlg.showMessageDialog('This is title', 'This is message', 'btOK');
    }

    testMessageCustom() {
        this._dlg.showMessageDialog('This is title', 'This is message', 'btYesNo', 400, undefined, undefined
            , 'Yes this is custom key Yes this is custom key', undefined, true);
    }


    _getData1(startIndex: number, pageSize: number, searchText: string): Observable<any> {
        let _data = [];

        for (let i = 0; i < 1000; i++) {
            let code = 'code-' + i;
            if (!searchText || code.indexOf(searchText) >= 0) {
                _data.push({
                    Id: 'code-' + i,
                    Name: 'Item number ' + i
                });
            }
        }

        let data = _data.slice(startIndex, startIndex + pageSize);

        if (startIndex === 0) {
            return new Observable((sub) => {
                sub.next({ListItems: data, Count: _data.length});
                sub.complete();
            });
        } else {
            return of({ListItems: data, Count: _data.length});
        }
    }

    onGUIIDClick() {
        let helper = this.injector.get(HelperService);
        for (let i = 0; i < 100; i++) {
            let gid = helper.UtilityService.createUUID();
            console.log(`id ${i} = ${gid}`);
            if (!helper.UtilityService.isGUId(gid)) {
                console.log(`--------- INVALID ID ----------------`);
            }
        }

    }

    getContact() {
        return this._http.get('src/assets/data/comments-data/contact.json').pipe(map(
            (result: any) => {
                return result.HierarchicalData;
            }
        ));
    }

    onUtilClick() {
        let helper = this.injector.get(HelperService);

        let duration = 2.03333;
        let h = helper.UtilityService.getHourFromTimestamp(duration * 60 * 60 * 1000);

        console.log('Duration = ', h);

        // 2.03333 -> 2h2m
        let end1 = helper.UtilityService.computeEndTimeFromDurationAndStartTime(duration, '02:04');


        console.log('-----test 1 start time 02:04 duration 2h2m');
        console.log('-----end1 = ', end1, ' -> ', end1 === '04:06');

        let end2 = helper.UtilityService.computeEndTimeFromDurationAndStartTime(duration, '02:03');

        console.log('-----test 2 start time 02:03 duration 2h2m');
        console.log('-----end2 = ', end2, ' -> ', end2 === '04:05');
    }

    onFieldIconClick() {
        console.log('onFieldIconClick ---- ');
    }

    onvalueChange(event) {
        console.log(event);
    }

    okClick() {
        console.log('selected dates', this.selectedDates)
    }
}
