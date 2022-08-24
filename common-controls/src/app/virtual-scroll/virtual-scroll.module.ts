import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VirtualScrollComponent } from './virtual-scroll.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { VirtualItemComponent } from './virtual-item/virtual-item.component';
import { MatButtonModule, MatIconModule } from '@angular/material';



@NgModule({
  declarations: [VirtualScrollComponent, VirtualItemComponent],
  exports: [
    VirtualScrollComponent,
    VirtualItemComponent
  ],
  imports: [
    CommonModule,
    VirtualScrollerModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class VirtualScrollModule { }
