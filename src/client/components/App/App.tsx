import * as React from 'react';
import * as d3 from 'd3-fetch';
import './App.css';

import { MapView, Feature } from '../MapView/MapView';
import { ControlPanel } from '../ControlPanel/ControlPanel';

export enum Metric {
  Volume,
  Density
}

export enum FlowDirection {
  OToD,
  DToO
}

export enum GeographyType {
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
  modes: Map<string, boolean>; // Trip modes to use in calculations
  purposes: Map<string, boolean>; // Trip purposes to use in calculations
  times: Map<string, boolean>; // Trip times to use in calculations
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
      modes: new Map<string, boolean>([
        ['all', true],
        ['auto', true],
        ['transit', true],
        ['active', true]
      ]),
      purposes: new Map<string, boolean>([
        ['all', true],
        ['home', true],
        ['work', true],
        ['school', true],
        ['shop', true],
        ['eat', true],
        ['escort', true],
        ['personal', true],
        ['quick', true],
        ['social', true],
        ['recreation', true]
      ]),
      times: new Map<string, boolean>([
        ['all', true],
        ['early', true],
        ['amShoulder1', true],
        ['amCrown', true],
        ['amShoulder2', true],
        ['midday', true],
        ['pmShoulder1', true],
        ['pmCrown', true],
        ['pmShoulder2', true],
        ['evening', true],
        ['overnight', true]
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
    let geographies = this.state.districts;
    let originField = 'originDistrict';
    let destField = 'destDistrict';

    if (this.state.geographyType === GeographyType.Zone) {
      geographies = this.state.zones;
      originField = 'originZone';
      destField = 'destZone';
    }

    const idToFeature = new Map<number, Feature>();
    geographies.forEach((feature: Feature) => {
      idToFeature.set(feature.properties.id, feature);
    });

    const tripData = new Map<number, number>();
    let minValue = Number.MAX_SAFE_INTEGER;
    let maxValue = 0;

    if (this.state.selected) {
      let filterField = destField;
      if (this.state.flowDirection === FlowDirection.DToO) {
        filterField = originField;
      }

      // Filter data based on which geography is selected
      const odData = this.totalData.filter(
        (d: ODDatum) => d[filterField] === this.state.selected
      );

      let sumField = originField;
      if (this.state.flowDirection === FlowDirection.DToO) {
        sumField = destField;
      }

      // Create a set of all geographies that flow to/from the selected one
      const filtered = new Set(odData.map((d: ODDatum) => d[sumField]));
      // Initialize the data sum to 0 for all entries in tripData
      filtered.forEach((id: number) => tripData.set(id, 0));

      // Create a list of all checked entries for each filter
      const checkedModes = [];
      this.state.modes.forEach((checked: boolean, mode: string) => {
        if (checked && mode !== 'all') checkedModes.push(mode);
      });
      const checkedPurposes = [];
      this.state.purposes.forEach((checked: boolean, purpose: string) => {
        if (checked && purpose !== 'all') checkedPurposes.push(purpose);
      });
      const checkedTimes = [];
      this.state.times.forEach((checked: boolean, time: string) => {
        if (checked && time !== 'all') checkedTimes.push(time);
      });

      odData.forEach((datum: ODDatum) => {
        const id = datum[sumField];

        for (const mode of checkedModes) {
          let addend = datum[mode];
          if (this.state.metric === Metric.Density) {
            addend /= idToFeature.get(id).properties.area;
          }
          tripData.set(id, tripData.get(id) + addend);
        }

        for (const purpose of checkedPurposes) {
          let addend = datum[purpose];
          if (this.state.metric === Metric.Density) {
            addend /= idToFeature.get(id).properties.area;
          }
          tripData.set(id, tripData.get(id) + addend);
        }

        for (const time of checkedTimes) {
          let addend = datum[time];
          if (this.state.metric === Metric.Density) {
            addend /= idToFeature.get(id).properties.area;
          }
          tripData.set(id, tripData.get(id) + addend);
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
   * Update the flow direction to use in calculations. The selected geography is
   * considered the destination when direction is O to D and the origin when
   * direction is D to O.
   * @param direction {string} The flow direction to use for calculations.
   */
  private updateFlowDirection(direction: string): void {
    if (direction === 'od') {
      this.setState({ flowDirection: FlowDirection.OToD });
    } else if (direction === 'do') {
      this.setState({ flowDirection: FlowDirection.DToO });
    }
    this.updateData();
  }

  /**
   * Update the data metric to use in calculations. Volume is the count of trips
   * to/from a geography and density is the count of trips divided by the area
   * of the geography (in square km).
   * @param metric {string} The type of metric to use for calculations.
   */
  private updateDataMetric(metric: string): void {
    if (metric === 'volume') {
      this.setState({ metric: Metric.Volume });
    } else if (metric === 'density') {
      this.setState({ metric: Metric.Density });
    }
    this.updateData();
  }

  /**
   * Update the geography type to use in calculations. Districts are larger
   * boundaries than zones. Each zone belongs to exactly one district.
   * @param type {string} The type of geography to use for calculations.
   */
  private updateGeographyType(type: string): void {
    if (type === 'district') {
      this.setState({ geographyType: GeographyType.District });
    } else if (type === 'zone') {
      this.setState({ geographyType: GeographyType.Zone });
    }
    this.updateData();
  }

  /**
   * Clones the desired AppState Map and updates its contents. Filters are
   * controlled by checkboxes so the contents are toggled on click.
   * @param filter {Map<string, boolean>} The filter to update.
   * @param value {string} The entry value to toggle.
   */
  private updateFilter(
    filter: Map<string, boolean>,
    value: string
  ): Map<string, boolean> {
    const cloned = new Map<string, boolean>(filter);

    if (value === 'all') {
      if (cloned.get('all')) {
        // Uncheck all entries
        cloned.forEach((_: boolean, key: string) => cloned.set(key, false));
      } else {
        // Check all entries
        cloned.forEach((_: boolean, key: string) => cloned.set(key, true));
      }
    } else {
      // Toggle the entry
      cloned.set(value, !cloned.get(value));
    }

    return cloned;
  }

  /**
   * Update the AppState according to what control entry is clicked.
   * @param control {string} The type of control that was clicked.
   * @param section {string} The type of section within the control that was
   *     clicked.
   * @param entry {string} The ID of the entry within the section that was
   *     clicked.
   */
  private handleEntryClicked(
    control: string,
    section: string,
    entry: string
  ): void {
    if (control === 'data') {
      if (section === 'flow') {
        this.updateFlowDirection(entry);
      } else if (section === 'metric') {
        this.updateDataMetric(entry);
      } else if (section === 'geography') {
        this.updateGeographyType(entry);
      }
    } else if (control === 'filter') {
      if (section === 'mode') {
        this.setState({ modes: this.updateFilter(this.state.modes, entry) });
      } else if (section === 'purpose') {
        this.setState({
          purposes: this.updateFilter(this.state.purposes, entry)
        });
      } else if (section === 'time') {
        this.setState({ times: this.updateFilter(this.state.times, entry) });
      }
    }
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
        <ControlPanel
          flowDirection={this.state.flowDirection}
          metric={this.state.metric}
          geographyType={this.state.geographyType}
          modes={this.state.modes}
          purposes={this.state.purposes}
          times={this.state.times}
          onEntryClicked={(
            control: string,
            section: string,
            entry: string
          ): void => {
            this.handleEntryClicked(control, section, entry);
          }}
        />
      </div>
    );
  }
}
