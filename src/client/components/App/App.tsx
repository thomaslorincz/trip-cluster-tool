import * as React from 'react';
import * as d3 from 'd3-fetch';
import './App.css';

import { MapView, Feature } from '../MapView/MapView';
import { ControlPanel } from '../ControlPanel/ControlPanel';

enum Geography {
  District,
  Zone
}

interface AppState {
  selected: number; // Selected geography ID
  hovered: number; // Hovered geography ID
  geography: Geography; // The type of geography data to use
  districts: Feature[];
  zones: Feature[];
  renderAbout: boolean;
}

/**
 * The app component of Trip Cluster Tool. The AppState interface is the data
 * model that the rest of the components use to render themselves.
 */
export class App extends React.Component<{}, AppState> {
  public constructor(props) {
    super(props);

    this.state = {
      selected: null,
      hovered: null,
      geography: Geography.District,
      districts: [],
      zones: [],
      renderAbout: false
    };

    // Load all required data files and add their contents to the AppState
    Promise.all([d3.json('./districts.json'), d3.json('./zones.json')]).then(
      ([districts, zones]): void => {
        this.setState({ districts, zones });
      }
    );
  }

  /**
   * Update which geography is selected by ID. If the geography is already
   * selected, the selection is cleared.
   * @param id {number} The ID of the geography to select.
   */
  private updateSelected(id: number): void {
    if (this.state.selected === id) {
      this.setState({ selected: null });
    } else {
      this.setState({ selected: id });
    }
  }

  /**
   * Update the geography type to use. Districts are larger boundaries than
   * zones.
   * @param type {'district'|'zone'} The type of geography to use for
   *     calculations.
   */
  private updateGeographyType(type: string) {
    if (type === 'district') {
      this.setState({ geography: Geography.District });
    } else {
      this.setState({ geography: Geography.Zone });
    }
  }

  public render(): React.ReactNode {
    return (
      <div className="app">
        <MapView
          selected={this.state.selected}
          hovered={this.state.hovered}
          boundaries={
            this.state.geography === Geography.District
              ? this.state.districts
              : this.state.zones
          }
          onClick={(id): void => this.updateSelected(id)}
          onHover={(id): void => this.setState({ hovered: id })}
          cursor={this.state.hovered ? 'pointer' : 'grab'}
        />
        {/*<ControlPanel />*/}
      </div>
    );
  }
}
