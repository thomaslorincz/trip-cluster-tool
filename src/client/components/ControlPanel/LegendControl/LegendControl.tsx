import * as React from 'react';

import { Control } from '../Control/Control';

interface Props {
  onEntryClicked: Function;
}

export class LegendControl extends React.Component<Props, {}> {
  public render(): React.ReactNode {
    return (
      <Control
        type="legend"
        title="Legend"
        sections={[]}
        onClick={(section, entry): void => {
          this.props.onEntryClicked(section, entry);
        }}
      />
    );
  }
}
