import {Component, Inject, ViewChild, ElementRef} from '@angular/core';
import {MatDialogRef} from '@angular/material';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {CustomFilter} from '../../shared/models/common.info';
import {Observable} from 'rxjs/Observable';
import {HelperService} from '../../core/services/helper.service';
import {finalize} from 'rxjs/operators';

@Component({
    selector: 'ntk-custom-filter-dialog',
    templateUrl: './custom-filter-dialog.html'
})

export class CustomFilterDialog {
    name: string;
    form: FormGroup;
    nameControl: FormControl;
    isGlobalControl: FormControl;
    isPinnedControl: FormControl;

    customFilters: CustomFilter[] = [];
    customFilter: CustomFilter;
    canManageGlobalFilters = false;

    @ViewChild('txtName', {static: false}) txtName: ElementRef;

    saveCallback: any;
    autoFocus: boolean;

    constructor(private dialogRef: MatDialogRef<any>,
                @Inject(MAT_DIALOG_DATA)  dialogData: any,
                private helperService: HelperService) {

        this.saveCallback = dialogData.Data.saveCallback;
        this.customFilter = dialogData.Data.customFilter;
        this.customFilters = dialogData.Data.customFilters;
        this.canManageGlobalFilters = dialogData.Data.canManageGlobalFilters;
        this.autoFocus = dialogData.Data.autoFocus;

        this.form = this.buildForm();

        this.form.get('isGlobal').valueChanges.subscribe(() => {
            this.onIsGlobalChanged();
        });


        this.onIsGlobalChanged();

    }

    private onIsGlobalChanged() {
        let isGlobal = this.isGlobalControl.value;
        if (isGlobal) {
            this.form.get('isPinned').enable({emitEvent: false});
        } else {
            this.form.get('isPinned').patchValue(false, {emitEvent: false});
            this.form.get('isPinned').disable({emitEvent: false});
        }
    }


    buildForm() {
        this.nameControl = new FormControl(this.customFilter.Name, [Validators.required, (form: FormControl) => {
            return this.nameValidator(form);
        }]);
        this.isGlobalControl = new FormControl(this.customFilter.Public);
        this.isPinnedControl = new FormControl(this.customFilter.MustPinned);

        return new FormGroup({
            name: this.nameControl,
            isGlobal: this.isGlobalControl,
            isPinned: this.isPinnedControl
        });
    }

    closeDialog(result?: CustomFilter) {
        this.dialogRef.close(result);
    }

    onSaveClicked() {
        this.save();
    }

    save() {
        let newCustomFilter = new CustomFilter(this.customFilter);
        newCustomFilter.Name = this.nameControl.value;
        newCustomFilter.Public = this.isGlobalControl.value || false;
        newCustomFilter.MustPinned = this.isPinnedControl.value || false;

        this.saveCustomFilter(newCustomFilter).subscribe((result) => {
            this.closeDialog(result);
        }, (responseError) => {
            if (responseError && responseError.error && responseError.error.code === 'NameMustBeUnique') {
                this.txtName.nativeElement.focus();
                this.helperService.DialogService.showApiErrorMessage('msgSaveCustomFilter_NameMustBeUnique');
            } else {
                this.helperService.DialogService.showApiError(responseError);
            }

        });
    }

    saveCustomFilter(customFilter: CustomFilter): Observable<CustomFilter> {
        this.helperService.isBusy = true;
        return this.saveCallback(customFilter).pipe(finalize(() => {
            this.helperService.isBusy = false;
        }));
    }

    nameValidator(control: FormControl) {

        // For public filter, do not check uni at UI
        if (this.isGlobalControl && this.isGlobalControl.value) {
            return null;
        }

        // tslint:disable-next-line
        let currentName = <string>(control.value || '').trim().toUpperCase();

        let index = this.customFilters.findIndex((item) => {

            if (this.customFilter.Id) { // edit
                return !item.Public && item.Name.toUpperCase() === currentName && this.customFilter.Name.toUpperCase() !== currentName;
            } else { // add new
                return !item.Public && item.Name.toUpperCase() === currentName;
            }

        });
        return index !== -1 ? {nameValidator: true} : null;

    }

    get canSave(): boolean {
        if (!!this.form) {
            return this.form.valid;
        } else {
            return false;
        }
    }

    onSubmit() {
        if (this.nameControl.valid) {
            this.save();
        }
    }

}
