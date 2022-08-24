import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BlockUIService {
  instanceId = '#block-ui';
  _isBusy = false;

  get isBusy(): boolean {
    return this._isBusy;
  }

  set isBusy(bValue: boolean) {
    this._isBusy = bValue;
    if (bValue) {
      this.start();
    } else {
      this.stop();
    }
  }

  start() {
    this._isBusy = true;
    $(this.instanceId).show();
  }

  stop() {
    this._isBusy = false;
    $(this.instanceId).hide();
  }
}
