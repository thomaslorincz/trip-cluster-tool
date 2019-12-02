import * as React from 'react';
import './ControlPanel.css';

import { AboutControl } from './AboutControl/AboutControl';
import { DataControl } from './DataControl/DataControl';
import { FilterControl } from './FilterControl/FilterControl';

export class ControlPanel extends React.Component<{}, {}> {
  public render(): React.ReactNode {
    return (
      <div className="control-panel">
        <AboutControl />
        <DataControl />
        <FilterControl />
      </div>
    );
  }
}
