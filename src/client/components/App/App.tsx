import * as React from 'react';
import * as d3 from 'd3-fetch';
import './App.css';

import { Feature, MapView } from '../MapView/MapView';
import {
  ControlPanel,
  FlowDirection,
  GeographyType,
  Metric
} from '../ControlPanel/ControlPanel';
import { LoadingScreen } from '../LoadingScreen/LoadingScreen';
import { Tooltip } from '../Tooltip/Tooltip';

interface TripDatum {
  // Origin-Destination Geographies
  originZone: number;
  destZone: number;
  originDistrict: number;
  destDistrict: number;

  // Trips by Mode, Purpose, and Time
  trips: [number[][]];
}

interface AppState {
  loading: boolean;

  // Map data
  selected: number; // Selected geography ID
  hovered: number; // Hovered geography ID
  tripData: Map<number, number>; // Map geography ID to volume/density
  minValue: number; // Minimum of tripData
  maxValue: number; // Maximum of tripData

  // Tooltip
  tooltipText: string;
  hoverX: number; // Tooltip x-coordinate
  hoverY: number; // Tooltip y-coordinate

  // Data control entries
  flowDirection: FlowDirection; // O -> D or D -> O
  metric: Metric; // Whether to calculate trip volume or density
  geographyType: GeographyType; // The type of geography data to use

  // Filter control entries
  modes: Map<string, boolean>; // Trip modes to use in calculations
  purposes: Map<string, boolean>; // Trip purposes to use in calculations
  times: Map<string, boolean>;
}

/**
 * The app component of Trip Cluster Tool. The AppState interface is the data
 * model that the rest of the components use to render themselves.
 */
export class App extends React.Component<{}, AppState> {
  /* The total OD data */
  private totalData: TripDatum[];

  /* GeoJSON boundary features */
  private districts: Feature[] = [];
  private zones: Feature[] = [];

  public constructor(props) {
    super(props);

    // Default state of the App
    this.state = {
      loading: true,
      selected: null,
      hovered: null,
      tripData: new Map<number, number>(),
      minValue: 0,
      maxValue: 0,
      tooltipText: '',
      hoverX: 0,
      hoverY: 0,
      flowDirection: FlowDirection.OToD,
      metric: Metric.Volume,
      geographyType: GeographyType.District,
      modes: new Map<string, boolean>([
        ['auto', true],
        ['transit', true],
        ['active', true]
      ]),
      purposes: new Map<string, boolean>([
        ['home', true],
        ['work', true],
        ['school', true],
        ['shop', true],
        ['eat', true],
        ['other', true]
      ]),
      times: new Map<string, boolean>([
        ['early', true],
        ['amRush', true],
        ['midday', true],
        ['pmRush', true],
        ['evening', true],
        ['overnight', true]
      ])
    };

    // Load all required data files and add their contents to the AppState
    Promise.all([
      d3.json('./od.json'),
      d3.json('./districts.json'),
      d3.json('./zones.json')
    ]).then(([trips, districts, zones]): void => {
      this.totalData = trips;
      this.districts = districts;
      this.zones = zones;

      this.setState({ loading: false });

      this.updateData(
        this.state.selected,
        this.state.flowDirection,
        this.state.metric,
        this.state.geographyType,
        new Map(this.state.modes),
        new Map(this.state.purposes),
        new Map(this.state.times)
      );
    });
  }

  /**
   * Calculate new data based on the options selected in the DataControl and
   * FilterControl. Each geography will be mapped to a calculated value which
   * will determine its choropleth colouration in the MapView.
   */
  private updateData(
    selected: number,
    flowDirection: FlowDirection,
    metric: Metric,
    geographyType: GeographyType,
    modes: Map<string, boolean>,
    purposes: Map<string, boolean>,
    times: Map<string, boolean>
  ): void {
    let geographies = this.districts;
    let originField = 'originDistrict';
    let destField = 'destDistrict';

    if (geographyType === GeographyType.Zone) {
      geographies = this.zones;
      originField = 'originZone';
      destField = 'destZone';
    }

    const tripData = new Map<number, number>();
    const idToArea = new Map<number, number>();
    geographies.forEach((feature: Feature) => {
      tripData.set(feature.properties.id, 0);
      idToArea.set(feature.properties.id, feature.properties.area);
    });

    let minValue = Number.MAX_SAFE_INTEGER;
    let maxValue = 0;

    if (selected !== null) {
      let selectedField = destField;
      if (flowDirection === FlowDirection.DToO) {
        selectedField = originField;
      }

      // Filter data based on which geography is selected
      const selectedData = this.totalData.filter((d: TripDatum) => {
        return d[selectedField] === selected;
      });

      let sumField = originField;
      if (flowDirection === FlowDirection.DToO) {
        sumField = destField;
      }

      // Create a list of all checked entries for each filter
      const modeFilter = Array.from(modes.values());
      const purposeFilter = Array.from(purposes.values());
      const timeFilter = Array.from(times.values());

      selectedData.forEach((datum: TripDatum) => {
        let addend = 0;

        modeFilter.forEach((modeChecked: boolean, i) => {
          if (!modeChecked) return;
          purposeFilter.forEach((purposeChecked: boolean, j) => {
            if (!purposeChecked) return;
            timeFilter.forEach((timeChecked: boolean, k) => {
              if (!timeChecked) return;
              addend += datum.trips[i][j][k];
            });
          });
        });

        // If metric is density, divide trip volume with feature area
        if (metric === Metric.Density) {
          addend /= idToArea.get(datum[sumField]);
        }

        tripData.set(datum[sumField], tripData.get(datum[sumField]) + addend);
      });

      tripData.forEach((volume: number) => {
        minValue = Math.min(minValue, volume);
        maxValue = Math.max(maxValue, volume);
      });
    }

    const tooltipText = this.generateTooltipText(
      selected,
      tripData,
      flowDirection,
      metric,
      geographyType
    );

    this.setState({ tripData, minValue, maxValue, tooltipText });
  }

  /**
   * Update which geography is selected by ID. If the geography is already
   * selected, the selection is cleared.
   * @param id {number} The ID of the geography to select.
   */
  private updateSelected(id: number): void {
    const selected = this.state.selected === id ? null : id;
    this.setState({ selected });
    this.updateData(
      selected,
      this.state.flowDirection,
      this.state.metric,
      this.state.geographyType,
      new Map(this.state.modes),
      new Map(this.state.purposes),
      new Map(this.state.times)
    );
  }

  /**
   * Update the flow direction to use in calculations. The selected geography is
   * considered the destination when direction is O to D and the origin when
   * direction is D to O.
   * @param direction {FlowDirection} The flow direction to use for
   *     calculations.
   */
  private updateFlowDirection(direction: FlowDirection): void {
    if (this.state.flowDirection === direction) return;

    this.setState({ flowDirection: direction });
    this.updateData(
      this.state.selected,
      direction,
      this.state.metric,
      this.state.geographyType,
      new Map(this.state.modes),
      new Map(this.state.purposes),
      new Map(this.state.times)
    );
  }

  /**
   * Update the data metric to use in calculations. Volume is the count of trips
   * to/from a geography and density is the count of trips divided by the area
   * of the geography (in square km).
   * @param metric {Metric} The type of metric to use for calculations.
   */
  private updateDataMetric(metric: Metric): void {
    if (this.state.metric === metric) return;

    this.setState({ metric });
    this.updateData(
      this.state.selected,
      this.state.flowDirection,
      metric,
      this.state.geographyType,
      new Map(this.state.modes),
      new Map(this.state.purposes),
      new Map(this.state.times)
    );
  }

  /**
   * Update the geography type to use in calculations. Districts are larger
   * boundaries than zones. Each zone belongs to exactly one district.
   * @param type {GeographyType} The type of geography to use for calculations.
   */
  private updateGeographyType(type: GeographyType): void {
    if (this.state.geographyType === type) return;

    this.setState({ selected: null, geographyType: type });
    this.updateData(
      null,
      this.state.flowDirection,
      this.state.metric,
      type,
      new Map(this.state.modes),
      new Map(this.state.purposes),
      new Map(this.state.times)
    );
  }

  /**
   * Clones the modes Map, updates its contents, and recalculates the map data.
   * @param mode {string} The mode entry to toggle.
   */
  private updateModesFilter(mode: string): void {
    const cloned = new Map<string, boolean>(this.state.modes);
    cloned.set(mode, !cloned.get(mode));
    this.setState({ modes: cloned });
    this.updateData(
      this.state.selected,
      this.state.flowDirection,
      this.state.metric,
      this.state.geographyType,
      cloned,
      new Map(this.state.purposes),
      new Map(this.state.times)
    );
  }

  /**
   * Clones the purposes Map, updates its contents, and recalculates the map
   * data.
   * @param purpose {string} The purpose entry to toggle.
   */
  private updatePurposesFilter(purpose: string): void {
    const cloned = new Map<string, boolean>(this.state.purposes);
    cloned.set(purpose, !cloned.get(purpose));
    this.setState({ purposes: cloned });
    this.updateData(
      this.state.selected,
      this.state.flowDirection,
      this.state.metric,
      this.state.geographyType,
      new Map(this.state.modes),
      cloned,
      new Map(this.state.times)
    );
  }

  /**
   * Clones the times Map, updates its contents, and recalculates the map data.
   * @param time {string} The time entry to toggle.
   */
  private updateTimesFilter(time: string): void {
    const cloned = new Map<string, boolean>(this.state.times);
    cloned.set(time, !cloned.get(time));
    this.setState({ times: cloned });
    this.updateData(
      this.state.selected,
      this.state.flowDirection,
      this.state.metric,
      this.state.geographyType,
      new Map(this.state.modes),
      new Map(this.state.purposes),
      cloned
    );
  }

  /**
   * Update the AppState according to what control entry is clicked.
   * @param control {string} The type of control that was clicked.
   * @param section {string} The type of section within the control that was
   *     clicked.
   * @param entry {string | number} The ID of the entry within the section that
   *     was clicked.
   */
  private handleEntryClicked(
    control: string,
    section: string,
    entry: string | number
  ): void {
    if (control === 'data') {
      if (section === 'flow') {
        this.updateFlowDirection(entry as FlowDirection);
      } else if (section === 'metric') {
        this.updateDataMetric(entry as Metric);
      } else if (section === 'geography') {
        this.updateGeographyType(entry as GeographyType);
      }
    } else if (control === 'filter') {
      if (section === 'mode') {
        this.updateModesFilter(entry as string);
      } else if (section === 'purpose') {
        this.updatePurposesFilter(entry as string);
      } else if (section === 'time') {
        this.updateTimesFilter(entry as string);
      }
    }
  }

  /**
   * Handle hover interactions on the map.
   * @param hovered {Feature} The map feature that is hovered.
   * @param x {number} The x-coordinate of the mouse hover.
   * @param y {number} The y-coordinate of the mouse hover.
   */
  private handleMapHover(hovered: Feature, x: number, y: number): void {
    let id = null;
    let text = '';
    if (hovered && hovered.properties) {
      id = hovered.properties.id;
      text = this.generateTooltipText(
        id,
        this.state.tripData,
        this.state.flowDirection,
        this.state.metric,
        this.state.geographyType
      );
    }

    this.setState({ hovered: id, tooltipText: text, hoverX: x, hoverY: y });
  }

  private generateTooltipText(
    id: number,
    tripData: Map<number, number>,
    flowDirection: FlowDirection,
    metric: Metric,
    geographyType: GeographyType
  ): string {
    const geographyText =
      geographyType === GeographyType.District ? 'District' : 'Zone';
    const firstLine = `${geographyText} ${this.state.hovered}\n`;

    const value = tripData.get(id);
    const valueText = metric === Metric.Volume ? value : value.toFixed(2);
    const metricText = metric === Metric.Volume ? 'trips' : 'trips/km²';
    const secondLine = `${valueText} ${metricText} per day\n`;

    const directionText = flowDirection === FlowDirection.OToD ? 'to' : 'from';
    const thirdLine = `${directionText} selected`;

    return `${firstLine}${secondLine}${thirdLine}`;
  }

  public render(): React.ReactNode {
    return (
      <div className="app">
        <MapView
          selected={this.state.selected}
          hovered={this.state.hovered}
          boundaries={
            this.state.geographyType === GeographyType.District
              ? this.districts
              : this.zones
          }
          tripData={this.state.tripData}
          minValue={this.state.minValue}
          maxValue={this.state.maxValue}
          onClick={(id): void => this.updateSelected(id)}
          onHover={(f, x, y): void => this.handleMapHover(f, x, y)}
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
        <Tooltip
          selected={this.state.selected}
          hovered={this.state.hovered}
          text={this.state.tooltipText}
          x={this.state.hoverX}
          y={this.state.hoverY}
        />
        <LoadingScreen loading={this.state.loading} />
      </div>
    );
  }
}
