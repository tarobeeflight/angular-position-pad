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
  readonly POOL_TABLE_WIDTH = 342;
  readonly POOL_TABLE_HEIGHT = 604;
  readonly POOL_TABLE_URL = 'assets/images/pool_table.svg';
  readonly POOL_TABLE_WITH_GRID_URL = 'assets/images/pool_table_with_grid.svg';

  // CanvasのHTML要素
  @ViewChild('poolCanvas', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;
  // キャンバスの画像オブジェクト
  private canvas!: fabric.Canvas;
  public canvasSize = {
    width: this.POOL_TABLE_WIDTH,
    height: this.POOL_TABLE_HEIGHT,
  };

  // ビリヤード台の画像オブジェクト
  private poolTable!: fabric.FabricImage;
  private poolTableWithGrid!: fabric.FabricImage;

  // 球（状態＋画像オブジェクト）リスト
  private balls: Ball[] = [];

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
    // canvasSizeを計算
  }

  async ngAfterViewInit() {
    await this.init();
  }

  // 初期化処理
  private async init(): Promise<void> {
    // Canvasの初期化: HTMLの<canvas id="poolCanvas">要素をFabricのインスタンスに関連付ける
    this.canvas = new fabric.Canvas(this.canvasElement.nativeElement, {
      backgroundColor: 'white',
      selection: true, // 複数のオブジェクト選択を許可
      // allowTouchScrolling: true,
    });

    // ビリヤード台の描画
    await this.drawTable();
    
    // 球の初期化と描画
    for (let i = 0; i <= 15; i++) {
      const imageUrl = i === 0 ? 'assets/images/cue_ball.svg' : `assets/images/ball_${i}.svg`;
      const image = await this.drawBall(i, imageUrl);
      this.balls.push({
        number: i,
        inTable: false,
        imageUrl: imageUrl,
        image: image,
      });
    }
  }

  // ビリヤード台描画メソッド
  private async drawTable() {
    // ビリヤード台画像オブジェクトの設定値
    const poolTableSetting = {
      left: this.POOL_TABLE_WIDTH,
      scaleX: 0.5,
      scaleY: 0.5,
      angle: 90,
      selectable: false,  // マウスで選択不可にする
      evented: false,     // クリックやドラッグイベントを無視する
      customType: 'billiardBall',
      visible: true,
    };
    const poolTableWithGridSetting = {
      left: this.POOL_TABLE_WIDTH,
      scaleX: 0.5,
      scaleY: 0.5,
      angle: 90,
      selectable: false,  // マウスで選択不可にする
      evented: false,     // クリックやドラッグイベントを無視する
      visible: false,
      customType: 'billiardBall'
    };

    // ビリヤード台画像をキャンバスに追加
    this.poolTable = await this.addImageToCanvas(this.POOL_TABLE_URL, false, poolTableSetting);
    this.poolTableWithGrid = await this.addImageToCanvas(this.POOL_TABLE_WITH_GRID_URL, false, poolTableWithGridSetting);
  }

  // 球描画メソッド
  private async drawBall(num: number, imageUrl: string): Promise<fabric.FabricImage> {

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
      visible: false, // 非表示
      customType: 'billiardBall'
    };

    return await this.addImageToCanvas(imageUrl, true, key);
  }

  // 球の表示・非表示切り替えメソッド
  private switchBallInTable(num: number) {
    const ball = this.balls.find((e) => e.number === num);
    if (ball) {
      ball.image.set({ 
        left: this.canvasSize.width / 2 - 18,
        top: this.canvasSize.height / 2 - 18,
        visible: !ball.inTable,
      });
      ball.inTable = !ball.inTable;

      // キャンバス周りの設定
      this.canvas.bringObjectToFront(ball.image);
      this.canvas.setActiveObject(ball.image);
      this.canvas.renderAll();
    }
  }

  // グリッド切り替えボタンイベント
  switchPoolTable() {
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
      this.switchBallInTable(num);
    });
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
  private getImageUrl(num: number) {
    const imageUrl = this.balls.find((e) => e.number === num)?.imageUrl;
    if (imageUrl) {
      return imageUrl;
    }
    return '';
  }
}