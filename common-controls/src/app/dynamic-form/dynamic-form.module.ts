import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DynamicFormComponent } from './dynamic-form.component';
import { DropdownModule } from '../dropdown/dropdown.module';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TreeDropdownModule } from '../tree-dropdown/tree-dropdown.module';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DataFieldModule } from '../data-field/data-field.module';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';

@NgModule({
  declarations: [DynamicFormComponent],
  imports: [
    CommonModule,
    DropdownModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    TreeDropdownModule,
    MatDialogModule,
    MatIconModule,
    MatToolbarModule,
    MatCheckboxModule,
    MatButtonModule,
    FlexLayoutModule,
    DataFieldModule,
    MatDividerModule,
    CommonControlsSharedModule,
  ],
  entryComponents: [DynamicFormComponent]
})
export class DynamicFormModule { }


export interface IFormDefinition {
  titleKey: string;
  confirmButtonKey?: string;

  fields: IFieldDefinition[];
}

export interface IFieldDefinition {
  placeHolderKey: string
  name: string;
  flex?: number;
  type: 'text' | 'check' | 'select' | 'room' | 'date' | 'divider' | 'read-only';
  disabled: boolean;
  required?: boolean;
}

export interface ISelectField extends IFieldDefinition {
  values: {Id: string; Name: string}[];
}

export interface IRoomField extends IFieldDefinition {
  siteId: string;
}

