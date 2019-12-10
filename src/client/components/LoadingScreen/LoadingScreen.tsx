import * as React from 'react';
import './LoadingScreen.css';

interface Props {
  loading: boolean;
}

export class LoadingScreen extends React.Component<Props, {}> {
  private readonly canvasRef: React.RefObject<HTMLCanvasElement>;

  constructor(props: Props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  public componentDidMount(): void {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = 120;

    ctx.translate(width / 2, width / 2);
    ctx.rotate((Math.PI * 360) / 360);
    ctx.lineWidth = Math.ceil(width / 50);
    ctx.lineCap = 'square';

    for (let i = 0; i <= 360; i++) {
      ctx.save();

      ctx.rotate((Math.PI * i) / 180);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      const opacity = (360 - i * 0.95) / 360;
      ctx.strokeStyle = 'rgba(255,255,255,' + opacity.toFixed(2) + ')';
      ctx.lineTo(0, width + 30);
      ctx.stroke();
      ctx.closePath();

      ctx.restore();
    }

    ctx.globalCompositeOperation = 'source-out';
    ctx.beginPath();
    ctx.arc(0, 0, width / 2, 2 * Math.PI, 0);
    ctx.fillStyle = 'white';
    ctx.fill();

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(0, 0, (width / 2) * 0.9, 2 * Math.PI, 0);
    ctx.fill();
  }

  public render(): React.ReactNode {
    const { loading } = this.props;

    return (
      <div
        className="loading-screen"
        style={{ display: loading ? 'block' : 'none' }}
      >
        <canvas
          ref={this.canvasRef}
          width={120}
          height={120}
          style={{
            animation: loading
              ? 'spin 1s infinite cubic-bezier(0.7, 0.4, 0.5, 0.7)'
              : 'none'
          }}
        />
      </div>
    );
  }
}
