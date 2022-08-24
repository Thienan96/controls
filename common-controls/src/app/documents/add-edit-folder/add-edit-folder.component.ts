import { Component, OnInit, AfterViewInit, Inject } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EditFormBaseController } from '../../core/edit-form-base.controller';
import { DialogData, IFolder } from '../../shared/models/common.info';
import { HelperService } from '../../core/services/helper.service';
import { EntityListService } from '../../core/services/entity-list.service';
import { EntityDetailsService } from '../../core/services/entity-details.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'ntk-add-edit-folder',
  templateUrl: './add-edit-folder.component.html',
  styleUrls: ['./add-edit-folder.component.css']
})
export class AddEditFolderComponent extends EditFormBaseController implements AfterViewInit, OnInit {
  getRooms: any;

  allRoles: any[];

  titleKey: string;

  showRoom: boolean;

  private _isInit = false;

  constructor(private _helperService: HelperService, private _detailService: EntityDetailsService
    , private dialogRef: MatDialogRef<AddEditFolderComponent>
    , private _listService: EntityListService, _formBuild: FormBuilder
    , @Inject(MAT_DIALOG_DATA) public dialogData: DialogData) {
    super();

    this.getRooms = this._getRooms.bind(this);

    console.log('received data ', dialogData);
    

    const folder = <IFolder>dialogData.Data.folder;

    const SiteId = (folder && folder.Site) ? folder.Site.Id : undefined;
    const parentFolder = dialogData.Data.parentFolder;
    this.titleKey = dialogData.Data.titleKey;
    this.showRoom = dialogData.Data.showRoom;
    this.allRoles = [
      { Id: 'Admin', Name: this._helperService.TranslationService.getTranslation('Role_Admin') },
      { Id: 'Manager', Name: this._helperService.TranslationService.getTranslation('Role_Manager') },
      { Id: 'User', Name: this._helperService.TranslationService.getTranslation('Role_User') }
    ]

    this.formGroup = _formBuild.group({
      ParentFolder: [{ value: parentFolder, disabled: false }],
      Name: [{ value: folder.Name, disabled: false }, Validators.required],
      VisibleBy: [{ value: this.setVisibleBy(folder.VisibleBy), disabled: false }],
      Room: [{ value: folder.Room, disabled: false }],
      SiteId: [{ value: SiteId, disabled: false }]
    });
  }

  private _getRooms(searchText: string, parent?: any): Observable<any[]> {

    // console.log('_getRooms:', searchText, ' -', parentId);

    const query = {
      Query: searchText,
      ParentRoomId: parent ? parent.Id : undefined,
      SiteId: this.getvalue('SiteId')
    }

    return this._listService.getListWithPost<any>('folder/Input/Room', query).pipe(map(data => {
      const rooms = data.map(item => {
        return Object.assign(item, {
          isExpandable: item.ChildrenCount > 0,
          isGroup: !item.Id,
          Level: !!item.Id ? item.Level : 0
        });
      });
      return rooms;
    }));
  }

  onSaveClick() {
    if (!this.formGroup.valid) {
      return;
    }
    const folderToSave: any = {};

    Object.assign(folderToSave, this.formGroup.getRawValue());
    Object.assign(folderToSave, {
      ParentFolderId: this.getvalue('ParentFolder', 'Id'),
      RoomId: this.getvalue('Room', 'Id'),
    });

    delete folderToSave.ParentFolder;

    this._helperService.DocumentService.saveFolder(folderToSave).subscribe(x => {
      this.dialogRef.close(x);
    }, (ex) => {
      if (ex.error && ex.error.code === 'ExistFolderName') {
        this.getControl('Name').setErrors({ unique: true });
      }
    });
  }
  ngOnInit() {
  }

  ngAfterViewInit(): void {
    this._isInit = true;
  }

  get canSave() {
    if (!this._isInit) {
      return false
    }

    return this.formGroup && this.formGroup.valid;
  }

  close() {
    this.dialogRef.close();
  }
  setVisibleBy(role): string {
    return role;
  }
}
