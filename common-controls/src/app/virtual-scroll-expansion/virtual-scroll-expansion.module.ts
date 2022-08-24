import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VirtualScrollExpansionComponent } from './virtual-scroll-expansion.component';
import { VirtualScrollerModule } from 'ngx-virtual-scroller';
import { MatButtonModule, MatCheckboxModule, MatExpansionModule, MatIconModule } from '@angular/material';
import { FlexModule } from '@angular/flex-layout';
import { ExpansionItemComponent } from './expansion-item/expansion-item.component';
import { FormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    VirtualScrollExpansionComponent, 
    ExpansionItemComponent, 
  ],
  imports: [
    CommonModule,
    
    VirtualScrollerModule,
    FlexModule,

    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatCheckboxModule,
    FormsModule
  ],
  exports: [
    VirtualScrollExpansionComponent,
    ExpansionItemComponent
  ]
})
export class VirtualScrollExpansionModule { }
