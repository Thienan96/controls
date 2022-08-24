import { NgModule } from '@angular/core';
import { SpeedDialFabComponent } from './speed-dial-fab.component';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from '../material.module';
import { CommonControlsSharedModule } from '../shared/common-controls-shared.module';

export * from './speed-dial-fab.component';

@NgModule({
  declarations: [SpeedDialFabComponent],
  exports: [SpeedDialFabComponent],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    CommonControlsSharedModule
  ]
})
export class SpeedDialFabModule { }
