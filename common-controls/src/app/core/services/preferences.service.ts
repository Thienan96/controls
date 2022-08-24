import { Injectable, Output, EventEmitter } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {

  private _settingsChanged = new Subject<any>();
  @Output() change: EventEmitter<any> = new EventEmitter();

  onSettingsChanged(): Observable<any> {
    return this._settingsChanged.asObservable();
  }

  constructor() { }

  raiseChange(settings: any) {
    this._settingsChanged.next(settings);
  }
}
