import * as React from 'react';
import './App.css';

import { MapView } from '../MapView/MapView';
import { ControlPanel } from '../ControlPanel/ControlPanel';

export class App extends React.Component<{}, {}> {
  public render(): React.ReactNode {
    return (
      <div className="app">
        <MapView />
        {/*<ControlPanel />*/}
      </div>
    );
  }
}
