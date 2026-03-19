import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'confirm-dialog',
  standalone: true,
  imports: [MatButtonModule],
  template: `
  <h2>{{data.title}}</h2>

  <p>{{data.message}}</p>

  <div style="display:flex; gap:10px; justify-content:flex-end">

    <button mat-button (click)="close()">Cancel</button>

    <button mat-raised-button [color]="data?.confirmColor || 'warn'" (click)="confirm()">
      {{data?.confirmText || 'Confirm'}}
    </button>

  </div>
  `
})
export class ConfirmDialog {

  constructor(
    private dialogRef: MatDialogRef<ConfirmDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  close(){
    this.dialogRef.close(false);
  }

  confirm(){
    this.dialogRef.close(true);
  }

}