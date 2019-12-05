import * as React from 'react';
import * as d3 from 'd3-fetch';
import './App.css';

import { MapView, Feature } from '../MapView/MapView';
import { ControlPanel } from '../ControlPanel/ControlPanel';

enum Metric {
  Volume,
  Density
}

enum FlowDirection {
  OToD,
  DToO
}

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
  metric: Metric; // Whether to calculate trip volume or density
  flowDirection: FlowDirection; // O -> D or D -> O
  odData: ODDatum[]; // Total OD data (from od.csv)
  tripData: Map<number, number>; // Map geography ID to volume/density
  minValue: number; // Minimum of tripData
  maxValue: number; // Maximum of tripData
  geographyType: GeographyType; // The type of geography data to use
  districts: Feature[]; // GeoJSON boundaries of districts
  zones: Feature[]; // GeoJSON boundaries of zones
  modes: Set<string>; // Set of all trip modes to use in calculations
  purposes: Set<string>; // Set of all trip purposes to use in calculations
  times: Set<string>; // Set of all time periods to use in calculations
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
      metric: Metric.Volume,
      flowDirection: FlowDirection.OToD,
      odData: [],
      tripData: new Map<number, number>(),
      minValue: 0,
      maxValue: 0,
      geographyType: GeographyType.District,
      districts: [],
      zones: [],
      modes: new Set<string>(['auto', 'transit', 'active']),
      purposes: new Set<string>([
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
      times: new Set<string>([
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
      ])
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

  /**
   * Calculate new data based on the options selected in the DataControl and
   * FilterControl. Each geography will be mapped to a calculated value which
   * will determine its choropleth colouration in the MapView.
   */
  private updateData(): void {
    let originField = 'originDistrict';
    let destField = 'destDistrict';

    if (this.state.geographyType === GeographyType.Zone) {
      originField = 'originZone';
      destField = 'destZone';
    }

    const tripData = new Map<number, number>();
    let minValue = Number.MAX_SAFE_INTEGER;
    let maxValue = 0;

    if (this.state.selected) {
      let filterField = destField;
      if (this.state.flowDirection === FlowDirection.DToO) {
        filterField = originField;
      }
      const odData = this.totalData.filter(
        (d: ODDatum) => d[filterField] === this.state.selected
      );

      let sumField = originField;
      if (this.state.flowDirection === FlowDirection.DToO) {
        sumField = destField;
      }
      const filtered = new Set(odData.map((d: ODDatum) => d[sumField]));
      filtered.forEach((id: number) => tripData.set(id, 0));

      const modeArray = Array.from(this.state.modes);
      const purposeArray = Array.from(this.state.purposes);
      const timeArray = Array.from(this.state.times);
      odData.forEach((datum: ODDatum) => {
        for (const mode of modeArray) {
          tripData.set(
            datum[sumField],
            tripData.get(datum[sumField]) + datum[mode]
          );
        }

        for (const purpose of purposeArray) {
          tripData.set(
            datum[sumField],
            tripData.get(datum[sumField]) + datum[purpose]
          );
        }

        for (const time of timeArray) {
          tripData.set(
            datum[sumField],
            tripData.get(datum[sumField]) + datum[time]
          );
        }
      });

      tripData.forEach((volume: number) => {
        minValue = Math.min(minValue, volume);
        maxValue = Math.max(maxValue, volume);
      });
    }

    this.setState({ tripData, minValue, maxValue });
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
          tripData={this.state.tripData}
          minValue={this.state.minValue}
          maxValue={this.state.maxValue}
          onClick={(id): void => this.updateSelected(id)}
          onHover={(id): void => this.setState({ hovered: id })}
          cursor={this.state.hovered ? 'pointer' : 'grab'}
        />
        {/*<ControlPanel />*/}
      </div>
    );
  }
}
