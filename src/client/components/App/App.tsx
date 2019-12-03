import * as React from 'react';
import './App.css';

import { MapView, Feature } from '../MapView/MapView';
import { ControlPanel } from '../ControlPanel/ControlPanel';

interface AppProps {
  zones: Feature[];
}

export class App extends React.Component<AppProps, {}> {
  public render(): React.ReactNode {
    const { zones } = this.props;

    return (
      <div className="app">
        <MapView zones={zones} />
        {/*<ControlPanel />*/}
      </div>
    );
  }
}
