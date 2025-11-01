import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import * as fabric from 'fabric';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BallDialog } from './ball-dialog/ball-dialog';
import { Ball } from '../types/data.types';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [MatDialogModule],
  providers: [DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, AfterViewInit {
  // ---------------------------------------------
  // 定数
  // ---------------------------------------------

  // 素材画像のサイズ
  private readonly POOL_TABLE_IMAGE_WIDTH = 684;
  private readonly POOL_TABLE_IMAGE_HEIGHT = 1208;
  private readonly BALL_IMAGE_DIAMETER = 26;
  private readonly ASPECT_RATIO = this.POOL_TABLE_IMAGE_WIDTH / this.POOL_TABLE_IMAGE_HEIGHT;
  private readonly BALL_DIAMETER_PER_TABLE_WIDTH = 0.05; // 台外径幅に対する球の直径の比率 : 見やすい嘘比率
  // private readonly BALL_DIAMETER_PER_TABLE_WIDTH = 0.035061; // 台外径幅に対する球の直径の比率

  // 出力画像のサイズ
  private readonly OUTPUT_IMAGE_WIDTH = 1368;
  private readonly OUTPUT_IMAGE_HEIGHT = 2416;

  // 画像ファイルのURL
  private readonly POOL_TABLE_URL = 'assets/images/pool_table.svg';
  private readonly POOL_TABLE_WITH_GRID_URL = 'assets/images/pool_table_with_grid.svg';

  // キャンバスサイズ
  public canvasSize = {
    width: 0,
    height: 0,
  };
  private ballDiameter: number = 0;

  // CanvasのHTML要素
  @ViewChild('poolCanvas', { static: true }) canvasElement!: ElementRef<HTMLCanvasElement>;
  // キャンバスの画像オブジェクト
  private canvas!: fabric.Canvas;

  // ビリヤード台の画像オブジェクト
  private poolTable!: fabric.FabricImage;
  private poolTableWithGrid!: fabric.FabricImage;

  // 球（状態＋画像オブジェクト）リスト
  private balls: Ball[] = [];

  constructor(private dialog: MatDialog, private datePipe: DatePipe) { }

  ngOnInit(): void {
    this.calculateCanvasSize();
  }

  async ngAfterViewInit() {
    await this.init();
  }

  // ウィンドウのリサイズイベントを捕捉
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.calculateCanvasSize();
  }


  calculateCanvasSize(): void {
    // キャンバスサイズの条件（上から優先）
    // 1. 画像のアスペクト比は変えない
    // 2. 横幅はウィンドウの幅と同じ。ただし最大は600px
    // 3. 高さはウィンドウの高さの80%以内

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 候補サイズ
    let candidateWidth: number = Math.min(windowWidth, 600);
    let candidateHeight: number = candidateWidth / this.ASPECT_RATIO;
    // 高さ制限
    const maxHeight = windowHeight * 0.8;

    // 高さ制限のチェック
    if (candidateHeight > maxHeight) {
      this.canvasSize.height = maxHeight;
      this.canvasSize.width = this.canvasSize.height * this.ASPECT_RATIO;
    } else {
      this.canvasSize.width = candidateWidth;
      this.canvasSize.height = candidateHeight;
    }

    // CSSバインディングのために小数点以下を丸める
    this.canvasSize.width = Math.floor(this.canvasSize.width);
    this.canvasSize.height = Math.floor(this.canvasSize.height);

    // 球の直径を計算
    this.ballDiameter = Math.floor(this.canvasSize.width * this.BALL_DIAMETER_PER_TABLE_WIDTH);
  }

  // 初期化処理
  private async init(): Promise<void> {
    // Canvasの初期化: HTMLの<canvas id="poolCanvas">要素をFabricのインスタンスに関連付ける
    this.canvas = new fabric.Canvas(this.canvasElement.nativeElement, {
      backgroundColor: 'white',
      selection: false, // 複数のオブジェクト選択を無効化
      allowTouchScrolling: true,
      devicePixelRatio: 4,
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

    this.canvas.renderAll();
  }

  // ビリヤード台描画メソッド
  private async drawTable() {
    // ビリヤード台画像オブジェクトの設定値
    const poolTableSetting = {
      scaleX: this.canvasSize.width / this.POOL_TABLE_IMAGE_WIDTH,
      scaleY: this.canvasSize.height / this.POOL_TABLE_IMAGE_HEIGHT,
      selectable: false,
      evented: false,
      visible: true, // 表示
    };
    const poolTableWithGridSetting = {
      scaleX: this.canvasSize.width / this.POOL_TABLE_IMAGE_WIDTH,
      scaleY: this.canvasSize.height / this.POOL_TABLE_IMAGE_HEIGHT,
      selectable: false,
      evented: false,
      visible: false, // 非表示
    };

    // ビリヤード台画像をキャンバスに追加
    this.poolTable = await this.addImageToCanvas(this.POOL_TABLE_URL, false, poolTableSetting);
    this.poolTableWithGrid = await this.addImageToCanvas(this.POOL_TABLE_WITH_GRID_URL, false, poolTableWithGridSetting);
  }

  // 球描画メソッド
  private async drawBall(num: number, imageUrl: string): Promise<fabric.FabricImage> {

    const key = {
      left: this.canvasSize.width / 2 - this.ballDiameter / 2,
      top: this.canvasSize.height / 2 - this.ballDiameter / 2,
      scaleX: this.ballDiameter / this.BALL_IMAGE_DIAMETER,
      scaleY: this.ballDiameter / this.BALL_IMAGE_DIAMETER,
      selectable: true,
      hasControls: false, // すべてのコントロールハンドル（拡大・縮小・回転）を非表示にする
      hasBorders: false,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      lockMovementX: false,
      lockMovementY: false,
      visible: false,
    };

    return await this.addImageToCanvas(imageUrl, true, key);
  }

  // 球の表示・非表示切り替えメソッド
  private switchBallInTable(num: number) {
    const ball = this.balls.find((e) => e.number === num);
    if (ball) {
      const nextState = !ball.inTable;

      // 球を中央に設定
      ball.image.set({
        left: this.canvasSize.width / 2 - this.ballDiameter / 2,
      top: this.canvasSize.height / 2 - this.ballDiameter / 2,
        visible: nextState,
      });
      ball.inTable = nextState;

      if (nextState) {
        // 表示する場合、球を最前面に移動し、アクティブに設定
        this.canvas.bringObjectToFront(ball.image);
        this.canvas.setActiveObject(ball.image);
      } else {
        // 非表示にする場合、アクティブオブジェクトをクリア
        this.canvas.discardActiveObject();
      }
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
      // todo : 画質が悪い
      multiplier: 4,
      format: 'png', // ファイル形式
      quality: 1.0   // 画質
    });

    // ダウンロード用の隠しリンク要素を作成
    const a = document.createElement('a');
    a.href = dataURL;
    
    // ファイル名の設定
    const formattedDateTime = this.datePipe.transform(new Date(), 'yyyyMMddHHmmss') ?? '';
    a.download = `positionpad_${formattedDateTime}.png`;

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
      const img = await fabric.FabricImage.fromURL(imageUrl);

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
}