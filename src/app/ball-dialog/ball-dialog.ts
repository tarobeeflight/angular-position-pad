import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Ball } from '../../types/data.types';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ball-dialog',
  imports: [MatDialogModule, CommonModule],
  templateUrl: './ball-dialog.html',
  styleUrl: './ball-dialog.scss'
})
export class BallDialog {
  constructor(@Inject(MAT_DIALOG_DATA) private balls: Ball[]){};

  public displayOrder = [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 0],
  ];

  public getImagePath(num: number) {
    const imagePath = this.balls.find((e) => e.number === num)?.imagePath;
    if (imagePath) {
      return imagePath;
    }
    return '';
  }
  public getInTable(num: number) {
    const inTable = this.balls.find((e) => e.number === num)?.inTable;
    if (inTable !== undefined) {
      return inTable
    }
    return false;
  }
}
