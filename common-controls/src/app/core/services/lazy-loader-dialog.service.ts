import {DialogService} from './dialog.service';
import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LazyLoaderDialogService {
  constructor(private dialogService: DialogService) {
  }

  createSliderDialog(componentName: string, ...params) {
    params = [this.getComponentByName(componentName)].concat(params);
    return this.dialogService.createSliderDialog.apply(this.dialogService, params);
  }

  createSliderDialogRef(componentName: string, ...params) {
    params = [this.getComponentByName(componentName)].concat(params);
    return this.dialogService.createSliderDialogRef.apply(this.dialogService, params);
  }

  openDialog(componentName: string, ...params) {
    params = [this.getComponentByName(componentName)].concat(params);
    return this.dialogService.openDialog.apply(this.dialogService, params);
  }

  getComponentByName(componentName: string) {
    return null;
  }
}
