import * as React from 'react';
import * as d3 from 'd3-fetch';
import './App.css';

import { MapView, Feature } from '../MapView/MapView';
import { ControlPanel } from '../ControlPanel/ControlPanel';

interface AppState {
  selected: number; // Selected geography ID
  hovered: number; // Hovered geography ID
  zones: Feature[];
}

export class App extends React.Component<{}, AppState> {
  constructor(props) {
    super(props);

    this.state = {
      selected: null,
      hovered: null,
      zones: []
    };

    Promise.all([d3.json('./zones.json')]).then(([zones]): void => {
      this.setState({ zones: zones });
    });
  }

  private updateSelected(id: number): void {
    if (this.state.selected === id) {
      this.setState({ selected: null });
    } else {
      this.setState({ selected: id });
    }
  }

  private updateHovered(id: number): void {
    this.setState({ hovered: id });
  }

  public render(): React.ReactNode {
    return (
      <div className="app">
        <MapView
          selected={this.state.selected}
          hovered={this.state.hovered}
          zones={this.state.zones}
          onClick={(id): void => this.updateSelected(id)}
          onHover={(id): void => this.updateHovered(id)}
          cursor={this.state.hovered ? 'pointer' : 'grab'}
        />
        {/*<ControlPanel />*/}
      </div>
    );
  }
}
