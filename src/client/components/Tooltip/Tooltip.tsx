import * as React from 'react';
import './Tooltip.css';

interface Props {
  text: string;
  x: number;
  y: number;
}

export class Tooltip extends React.Component<Props, {}> {
  public render(): React.ReactNode {
    const { text, x, y } = this.props;

    return (
      <div
        className="tooltip"
        style={{
          display: text ? 'block' : 'none',
          left: x - (6 + (text.length / 2) * 8),
          top: y - 28
        }}
      >
        {text}
      </div>
    );
  }
}
