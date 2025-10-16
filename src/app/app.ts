import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as fabric from 'fabric';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BallDialog } from './ball-dialog/ball-dialog';
import { filter } from 'rxjs';
import { Ball } from '../types/data.types';

@Component({
  selector: 'app-root',
  imports: [MatDialogModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, AfterViewInit {
  // 定数
  POOL_TABLE_WIDTH = 342;
  POOL_TABLE_HEIGHT = 604;
  CANVAS_PADDING = 30;

  // キャンバス
  private canvas!: fabric.Canvas;
  public canvasSize = {
    width: this.POOL_TABLE_WIDTH + 2 * this.CANVAS_PADDING,
    height: this.POOL_TABLE_HEIGHT + 2 * this.CANVAS_PADDING,
  };

  

  // 球
  private balls: Ball[] = [
    {
      number: 0,
      inTable: false,
      imagePath: 'assets/images/cue_ball.svg',
    },
    {
      number: 1,
      inTable: false,
      imagePath: 'assets/images/ball_1.svg',
    },
    {
      number: 2,
      inTable: false,
      imagePath: 'assets/images/ball_2.svg',
    },
    {
      number: 3,
      inTable: false,
      imagePath: 'assets/images/ball_3.svg',
    },
    {
      number: 4,
      inTable: false,
      imagePath: 'assets/images/ball_4.svg',
    },
    {
      number: 5,
      inTable: false,
      imagePath: 'assets/images/ball_5.svg',
    },
    {
      number: 6,
      inTable: false,
      imagePath: 'assets/images/ball_6.svg',
    },
    {
      number: 7,
      inTable: false,
      imagePath: 'assets/images/ball_7.svg',
    },
    {
      number: 8,
      inTable: false,
      imagePath: 'assets/images/ball_8.svg',
    },
    {
      number: 9,
      inTable: false,
      imagePath: 'assets/images/ball_9.svg',
    },
    {
      number: 10,
      inTable: false,
      imagePath: 'assets/images/ball_10.svg',
    },
    {
      number: 11,
      inTable: false,
      imagePath: 'assets/images/ball_11.svg',
    },
    {
      number: 12,
      inTable: false,
      imagePath: 'assets/images/ball_12.svg',
    },
    {
      number: 13,
      inTable: false,
      imagePath: 'assets/images/ball_13.svg',
    },
    {
      number: 14,
      inTable: false,
      imagePath: 'assets/images/ball_14.svg',
    },
    {
      number: 15,
      inTable: false,
      imagePath: 'assets/images/ball_15.svg',
    },
  ];

  // CanvasのHTML要素
  @ViewChild('poolCanvas', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;

  // 描画オブジェクト
  private poolTable!: fabric.FabricImage;
  private poolTableWithGrid!: fabric.FabricImage;

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    // canvasSizeを計算
  }

  async ngAfterViewInit() {
    await this.initFabricCanvas();
  }

  // 初期化処理
  async initFabricCanvas(): Promise<void> {
    // Canvasの初期化: HTMLの<canvas id="poolCanvas">要素をFabricのインスタンスに関連付ける
    this.canvas = new fabric.Canvas(this.canvasElement.nativeElement, {
      backgroundColor: 'white',
      selection: true, // 複数のオブジェクト選択を許可
    });
    console.log('Fabric Canvasが初期化されました。');

    // ビリヤード台画像のパス
    const poolTableUrl = 'assets/images/pool_table.svg';
    const poolTableWithGridUrl = 'assets/images/pool_table_with_grid.svg';

    // ビリヤード台画像オブジェクトの設定値
    const poolTableSetting = {
      left: this.POOL_TABLE_WIDTH + this.CANVAS_PADDING,
      top: this.CANVAS_PADDING,
      scaleX: 0.5,
      scaleY: 0.5,
      angle: 90,
      selectable: false,  // マウスで選択不可にする
      evented: false,     // クリックやドラッグイベントを無視する
      customType: 'billiardBall'
    };
    const poolTableWithGridSetting = {
      left: this.POOL_TABLE_WIDTH + this.CANVAS_PADDING,
      top: this.CANVAS_PADDING,
      scaleX: 0.5,
      scaleY: 0.5,
      angle: 90,
      selectable: false,  // マウスで選択不可にする
      evented: false,     // クリックやドラッグイベントを無視する
      visible: false,
      customType: 'billiardBall'
    };

    // ビリヤード台画像をキャンバスに追加
    this.poolTable = await this.addImageToCanvas(poolTableUrl, false, poolTableSetting);
    this.poolTableWithGrid = await this.addImageToCanvas(poolTableWithGridUrl, false, poolTableWithGridSetting);
  }

  // 球追加メソッド（ダイアログで処理するようにする）
  private async addBall(num: number): Promise<void> {

    const imageUrl = this.getImagePath(num);

    const key = {
      left: this.canvasSize.width / 2 - 18,
      top: this.canvasSize.height / 2 - 18,
      scaleX: 1,
      scaleY: 1,
      hasControls: false, // すべてのコントロールハンドル（拡大・縮小・回転）を非表示にする
      hasBorders: true,  // 選択時の境界線は表示する（任意）
      lockScalingX: true, // X方向の拡大縮小をロック
      lockScalingY: true, // Y方向の拡大縮小をロック
      lockRotation: true, // 回転をロック
      lockMovementX: false, // X方向の移動は許可 (デフォルト)
      lockMovementY: false, // Y方向の移動は許可 (デフォルト)
      customType: 'billiardBall'
    };

    await this.addImageToCanvas(imageUrl, true, key);
  }

  // グリッド切り替えボタンイベント
  togglePoolTable() {
    this.poolTable.set({ visible: !this.poolTable.visible });
    this.poolTableWithGrid.set({ visible: !this.poolTableWithGrid.visible });
    this.canvas.renderAll();
  }

  // ダウンロードボタンイベント
  downloadImage(): void {
    if (!this.canvas) {
      console.error('Canvasが初期化されていません。');
      return;
    }

    // Canvasの内容をData URL（PNG形式の画像データ）として取得
    const dataURL = this.canvas.toDataURL({
      // キャンバスの大きさと出力画像の拡大率
      // todo : 計算必要？PCとspで出力画像のサイズがことなってしまう。
      multiplier: 1,
      format: 'png', // ファイル形式
      quality: 1.0   // 画質
    });

    // ダウンロード用の隠しリンク要素を作成
    const a = document.createElement('a');
    a.href = dataURL; // 画像データをリンクのURLに設定
    a.download = 'billiards_layout.png'; // ダウンロード時のファイル名

    // リンクをクリックしてダウンロードをトリガー
    // DOMに一時的に追加・クリック・削除することで、ダウンロードダイアログを表示させる
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // ダイアログを開くメソッド
    openDialog(): void {
    // ダイアログを開く
    const dialogRef = this.dialog.open(BallDialog, {
      width: '400px',
      data: this.balls,
    });

    // ダイアログが閉じられた後の処理を購読
    dialogRef.afterClosed().subscribe(num => {
      console.log('ダイアログが閉じた後');
      this.addBall(num);
    });
    // dialogRef.afterClosed().pipe(
    //   filter(result => result === true) 
    // ).subscribe(result => {
    //   // ユーザーが「ダウンロード」を選択した場合の処理
    //   console.log('ユーザーはダウンロードを選択しました。');
    //   // this.downloadImage(); // 実際のダウンロードメソッドを呼び出す
    // });
  }

  // キャンバスに画像オブジェクトを追加するメソッド
  private async addImageToCanvas(imageUrl: string, isFront: boolean, setting: string | Record<string, any>) {
    try {
      // 画像から描画オブジェクトを生成
      const img = await fabric.FabricImage.fromURL(imageUrl, {
        crossOrigin: 'anonymous'
      });

      // 描画オブジェクトの状態を設定
      img.set(setting);

      // 描画オブジェクトをキャンバスに追加し再描画
      this.canvas.add(img);
      if (isFront) {
        this.canvas.bringObjectToFront(img);
      } else {
        this.canvas.sendObjectToBack(img);
      }
      this.canvas.renderAll();

      return img;

    } catch (error) {
      console.error('画像のロード中にエラーが発生しました:', error);
      throw error;
    }
  }

  // ダイアログにも同じメソッドあるから共通化した方がいい
  private getImagePath(num: number) {
    const imagePath = this.balls.find((e) => e.number === num)?.imagePath;
    if (imagePath) {
      return imagePath;
    }
    return '';
  }
  // ダイアログにも同じメソッドあるから共通化した方がいい
  private getInTable(num: number) {
    const inTable = this.balls.find((e) => e.number === num)?.inTable;
    if (inTable !== undefined) {
      return inTable
    }
    return false;
  }
}