import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule, MatProgressSpinnerModule } from '@angular/material';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatMenuModule } from '@angular/material/menu';
import { AvatarUploadComponent } from './avatar-upload.component';
@NgModule({
  imports: [
    CommonModule,
    MatIconModule,
    FlexLayoutModule,
    MatProgressSpinnerModule,
    MatMenuModule
  ],
  exports: [
    AvatarUploadComponent
  ],
  declarations: [AvatarUploadComponent]
})
export class AvatarUploadModule { }
