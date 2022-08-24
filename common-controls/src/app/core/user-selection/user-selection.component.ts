import {COMMA, ENTER} from '@angular/cdk/keycodes';
import {Component, ElementRef, EventEmitter, Input, Output, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {IPartyEmail} from '../../shared/models/common.info';

@Component({
    selector: 'ntk-user-selection',
    templateUrl: './user-selection.component.html'
})
export class UserSelection {
    addOnBlur = true;
    separatorKeysCodes: number[] = [ENTER, COMMA];
    userCtrl = new FormControl();
    filteredUsers: Observable<IPartyEmail[]>;

    @ViewChild('userInput', {static: false}) userInput: ElementRef<HTMLInputElement>;
    @ViewChild('auto', {static: false}) matAutocomplete: MatAutocomplete;
    @Input() availableUsers: IPartyEmail[];
    @Input() placeholder: string;
    @Input() selectedUsers: IPartyEmail[];
    @Input() readOnly: boolean;
    @Input() isMandatory: boolean;
    @Output() selectionChanged = new EventEmitter<IPartyEmail[]>();

    constructor() {
        this.filteredUsers = this.userCtrl.valueChanges.pipe(
            startWith(null),
            map((user: IPartyEmail | string) => user ? this._filter(user) : (this.availableUsers ? this.availableUsers.slice() : undefined)));
    }

    add(event: MatChipInputEvent): void {
        if (!this.selectedUsers)
            this.selectedUsers = [];

        // Add user only when MatAutocomplete is not open
        // To make sure this does not conflict with OptionSelected Event
        if (!this.matAutocomplete.isOpen) {
            const input = event.input;
            const value = event.value;

            if (!!value) {
                let users: IPartyEmail[] = this.availableUsers.filter(user => user.Name.toLowerCase() === value.toLowerCase() || user.Email.toLowerCase() === value.toLowerCase());
                if (users && users.length > 0) {
                    this.selectedUsers.push(users[0]);

                    //raise event selectionChanged
                    this.selectionChanged.emit(this.selectedUsers);
                }
            }

            // Reset the input value
            if (input) {
                input.value = '';
            }

            this.userCtrl.setValue(null);
        }
    }

    remove(user: IPartyEmail): void {
        const index = this.selectedUsers.indexOf(user);

        if (index >= 0) {
            this.selectedUsers.splice(index, 1);

            //raise event selectionChanged
            this.selectionChanged.emit(this.selectedUsers);
        }
    }

    selected(event: MatAutocompleteSelectedEvent): void {

        // Not allow select the Grouping item
        if (event.option.value.IsGrouping) return;

        if (!this.selectedUsers)
            this.selectedUsers = [];

        if (event)
            this.selectedUsers.push(event.option.value);

        this.userInput.nativeElement.value = '';
        this.userCtrl.setValue(null);

        //raise event selectionChanged
        if (event)
            this.selectionChanged.emit(this.selectedUsers);
    }

    private _filter(value: IPartyEmail | string): IPartyEmail[] | undefined {
        // console.log('--------------------filter users by:', value);

        if (typeof value === "string") {
            const filterValue = value.toLowerCase();

            // We always show the Grouping
            return this.availableUsers.filter((user: any) => user.IsGrouping 
                            || user.Name.toLowerCase().indexOf(filterValue) >= 0 || user.Email.toLowerCase().indexOf(filterValue) >= 0);
        }
        else
            return undefined;
    }

    ngAfterViewInit() {
        // This to avaoid lifecycle hook error
        setTimeout(() => {
            if (this.readOnly)
                this.userCtrl.disable();
        });
    }
}
