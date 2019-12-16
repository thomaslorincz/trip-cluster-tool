import * as React from 'react';
import './Tooltip.css';

interface Props {
  selected: number;
  hovered: number;
  text: string;
  x: number;
  y: number;
}

export class Tooltip extends React.Component<Props, {}> {
  private readonly lineHeight = 22;

  public render(): React.ReactNode {
    const { selected, hovered, text, x, y } = this.props;

    const lines = text.split('\n');
    let maxLineLength = 0;
    for (const line of lines) {
      maxLineLength = Math.max(line.length, maxLineLength);
    }

    return (
      <div
        className="tooltip"
        style={{
          display: selected && hovered ? 'block' : 'none',
          left: x - (6 + (maxLineLength / 2) * 8),
          top: y - (lines.length * this.lineHeight + 2)
        }}
      >
        {text}
      </div>
    );
  }
}
