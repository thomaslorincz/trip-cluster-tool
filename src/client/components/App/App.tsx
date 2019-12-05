import * as React from 'react';
import * as d3 from 'd3-fetch';
import './App.css';

import { MapView, Feature } from '../MapView/MapView';
import { ControlPanel } from '../ControlPanel/ControlPanel';

enum GeographyType {
  District,
  Zone
}

interface ODDatum {
  // Origin-Destination Zone
  originZone: number;
  destZone: number;
  // Origin-Destination District
  originDistrict: number;
  destDistrict: number;
  // Transportation Mode
  auto: number;
  transit: number;
  active: number;
  // Purpose of Travel
  home: number;
  work: number;
  school: number;
  shop: number;
  eat: number;
  escort: number;
  personal: number;
  quick: number;
  social: number;
  recreation: number;
  // Time of Day
  early: number;
  amShoulder1: number;
  amCrown: number;
  amShoulder2: number;
  midday: number;
  pmShoulder1: number;
  pmCrown: number;
  pmShoulder2: number;
  evening: number;
  overnight: number;
}

interface AppState {
  selected: number; // Selected geography ID
  hovered: number; // Hovered geography ID
  odData: ODDatum[];
  tripVolume: Map<number, number>;
  minVolume: number;
  maxVolume: number;
  geographyType: GeographyType; // The type of geography data to use
  districts: Feature[];
  zones: Feature[];
  mode: Set<string>;
  purpose: Set<string>;
  time: Set<string>;
  renderAbout: boolean;
}

/**
 * The app component of Trip Cluster Tool. The AppState interface is the data
 * model that the rest of the components use to render themselves.
 */
export class App extends React.Component<{}, AppState> {
  private totalData: ODDatum[] = [];

  public constructor(props) {
    super(props);

    // Default state of the App
    this.state = {
      selected: null,
      hovered: null,
      odData: [],
      tripVolume: new Map<number, number>(),
      minVolume: 0,
      maxVolume: 0,
      geographyType: GeographyType.District,
      districts: [],
      zones: [],
      mode: new Set<string>(['auto', 'transit', 'active']),
      purpose: new Set<string>([
        'home',
        'work',
        'school',
        'shop',
        'eat',
        'escort',
        'personal',
        'quick',
        'social',
        'recreation'
      ]),
      time: new Set<string>([
        'early',
        'amShoulder1',
        'amCrown',
        'amShoulder2',
        'midday',
        'pmShoulder1',
        'pmCrown',
        'pmShoulder2',
        'evening',
        'overnight'
      ]),
      renderAbout: false
    };

    // Load all required data files and add their contents to the AppState
    Promise.all([
      d3.csv('./od.csv'),
      d3.json('./districts.json'),
      d3.json('./zones.json')
    ]).then(
      ([odData, districts, zones]: [ODDatum[], Feature[], Feature[]]): void => {
        this.setState({ districts, zones });

        // Map all parsed string values to integers
        this.totalData = [];
        odData.forEach((value: ODDatum) => {
          const mapped: ODDatum = {} as ODDatum;
          for (const property in value) {
            if (!Object.hasOwnProperty.call(value, property)) continue;
            mapped[property] = parseInt(value[property]);
          }
          this.totalData.push(mapped);
        });

        this.updateData();
      }
    );
  }

  private updateData(): void {
    const { selected, geographyType, mode, purpose, time } = this.state;

    let originField = 'originDistrict';
    if (geographyType === GeographyType.Zone) {
      originField = 'originZone';
    }

    let destField = 'destDistrict';
    if (geographyType === GeographyType.Zone) {
      destField = 'destZone';
    }

    const tripVolume = new Map<number, number>();
    let minVolume = Number.MAX_SAFE_INTEGER;
    let maxVolume = 0;

    if (selected) {
      const odData = this.totalData.filter(
        (d: ODDatum) => d[destField] === selected
      );
      const origins = new Set(odData.map((d: ODDatum) => d[originField]));
      origins.forEach((origin: number) => {
        tripVolume.set(origin, 0);
      });

      const modeArray = Array.from(mode);
      const purposeArray = Array.from(purpose);
      const timeArray = Array.from(time);
      odData.forEach((d: ODDatum) => {
        for (const m of modeArray) {
          tripVolume.set(d[originField], tripVolume.get(d[originField]) + d[m]);
        }

        for (const p of purposeArray) {
          tripVolume.set(d[originField], tripVolume.get(d[originField]) + d[p]);
        }

        for (const t of timeArray) {
          tripVolume.set(d[originField], tripVolume.get(d[originField]) + d[t]);
        }
      });

      tripVolume.forEach((volume: number) => {
        minVolume = Math.min(minVolume, volume);
        maxVolume = Math.max(maxVolume, volume);
      });
    }

    this.setState({ tripVolume, minVolume, maxVolume });
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
    this.updateData();
  }

  /**
   * Update the geography type to use. Districts are larger boundaries than
   * zones.
   * @param type {'district'|'zone'} The type of geography to use for
   *     calculations.
   */
  private updateGeographyType(type: string): void {
    if (type === 'district') {
      this.setState({ geographyType: GeographyType.District });
    } else {
      this.setState({ geographyType: GeographyType.Zone });
    }
    this.updateData();
  }

  public render(): React.ReactNode {
    return (
      <div className="app">
        <MapView
          selected={this.state.selected}
          hovered={this.state.hovered}
          boundaries={
            this.state.geographyType === GeographyType.District
              ? this.state.districts
              : this.state.zones
          }
          tripVolume={this.state.tripVolume}
          minVolume={this.state.minVolume}
          maxVolume={this.state.maxVolume}
          onClick={(id): void => this.updateSelected(id)}
          onHover={(id): void => this.setState({ hovered: id })}
          cursor={this.state.hovered ? 'pointer' : 'grab'}
        />
        {/*<ControlPanel />*/}
      </div>
    );
  }
}
