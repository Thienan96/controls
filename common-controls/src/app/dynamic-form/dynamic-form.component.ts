import {Component, OnInit, Injector, Inject, ElementRef} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { IFormDefinition, IFieldDefinition, IRoomField } from './dynamic-form.module';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { BaseDialog } from '../core/dialogs/base.dialog';
import { DialogData } from '../shared/models/common.info';
import {EntityListService} from '../core/services/entity-list.service';
import { map } from 'rxjs/operators';

@Component({
    selector: 'ntk-dynamic-form',
    templateUrl: './dynamic-form.component.html',
    styleUrls: ['./dynamic-form.component.css']
})
export class DynamicFormComponent extends BaseDialog implements OnInit {

    public formDefinition: IFormDefinition;

    titleKey: string;

    saveKey: string;

    form: FormGroup;
    getRooms: any;
    private initValue: any;

    private _listService: EntityListService

    private _saveCallback: (value: any) => Observable<any>;
  constructor(private injector: Injector, private dialogRef: MatDialogRef<any>
        , @Inject(MAT_DIALOG_DATA) public dialogData: DialogData, private _formBuild: FormBuilder) {
        super(injector, dialogRef, dialogData);

        this._listService = injector.get(EntityListService);

        this.formDefinition = dialogData.Data.formDefinition;
        this.initValue = dialogData.Data.value;
        this._saveCallback = dialogData.Data.saveCallback;

        this.titleKey = this.formDefinition.titleKey;
        if (this.formDefinition.confirmButtonKey) {
            this.saveKey = this.formDefinition.confirmButtonKey;
        } else {
            this.saveKey = 'btSave';
        }

        this.getRooms = this._getRooms.bind(this);

        this.form = this.buildForm();

        // console.log('form: ', this.form);
    }

    private buildForm() {
        const group: any = {};

        this.formDefinition.fields.forEach(f => {
            group[f.name] = this.createField(f);
        });

        return new FormGroup(group);
    }

    private createField(field: IFieldDefinition): any {
        let control: FormControl;
        if (field.required) {
      control =  new FormControl(undefined, Validators.required);
        } else {
      control =  new FormControl();
        }

        if (field.disabled) {
            control.disable();
        }

    if (!field.flex) { field.flex = 100; }

        return control;
    }

    private _getRooms(searchText: string, parentId?: string, context?: string): Observable<any[]> {

        // This to avoid error from server
        if (!context) {
            return of([]);
        }

        console.log('_getRooms:', searchText, ' -', parentId, ' - ', context);

        let siteId = undefined;
        this.formDefinition.fields.forEach(f => {
            if (f.name === context) {
                siteId = (<IRoomField>f).siteId;
            }
        });

        const query = {
            Query: searchText,
            ParentRoomId: parentId,
            SiteId: siteId
        }

        return this._listService.getListWithPost<any>('Common/GetDropdownRooms', query).pipe(map(data => {
            const result = data.map(item => {
                return Object.assign(item, {
                    isExpandable: item.ChildrenCount > 0
                });
            });
            return result;
        }));
    }

    get canSave(): boolean {
        if (!!this.form) {
            return this.form.valid;
        } else {
            return false;
        }
    }

    ngOnInit() {
        // console.log('patch value: ', this.initValue);
        this.form.patchValue(this.initValue);
    }

    onSaveClick() {
    const toSave = <any>{
    };

        Object.assign(toSave, this.initValue);
        Object.assign(toSave, this.form.getRawValue());

        if (this._saveCallback) {
            this._saveCallback(toSave).subscribe(x => {
                this.close(x);
            });
        }
    }

    setFocus(name: string) {
        let elementRef = this.injector.get(ElementRef, null);
        if (elementRef) {
            let el = $(elementRef.nativeElement).find('#' + name)[0];
            el.focus();
        }
    }

}
