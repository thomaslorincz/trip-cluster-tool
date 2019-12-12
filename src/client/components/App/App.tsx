import * as React from 'react';
import * as d3 from 'd3-fetch';
import './App.css';

import { MapView, Feature } from '../MapView/MapView';
import { ControlPanel } from '../ControlPanel/ControlPanel';
import { LoadingScreen } from '../LoadingScreen/LoadingScreen';
import { Tooltip } from '../Tooltip/Tooltip';

export enum FlowDirection {
  OToD, // Origin to Destination
  DToO // Destination to Origin
}

export enum Metric {
  Volume,
  Density
}

export enum GeographyType {
  District,
  Zone
}

interface PurposeDatum {
  home: number;
  work: number;
  school: number;
  shop: number;
  eat: number;
  other: number;
}

interface ODDatum {
  // Origin-Destination Geographies
  originZone: number;
  destZone: number;
  originDistrict: number;
  destDistrict: number;

  // Mode and Purpose data
  auto: PurposeDatum;
  transit: PurposeDatum;
  active: PurposeDatum;
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
}

/**
 * The app component of Trip Cluster Tool. The AppState interface is the data
 * model that the rest of the components use to render themselves.
 */
export class App extends React.Component<{}, AppState> {
  /* The total OD data */
  private totalData: ODDatum[] = [];

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
      metric: Metric.Volume,
      flowDirection: FlowDirection.OToD,
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
      ])
    };

    // Load all required data files and add their contents to the AppState
    Promise.all([
      d3.csv('./od.csv'),
      d3.json('./districts.json'),
      d3.json('./zones.json')
    ]).then(
      ([odData, districts, zones]: [{}[], Feature[], Feature[]]): void => {
        // Map all parsed string values to integers
        odData.forEach(value => {
          const mapped: ODDatum = {} as ODDatum;

          const geoProperties = [
            'originZone',
            'destZone',
            'originDistrict',
            'destDistrict'
          ];

          for (const property in value) {
            if (!Object.hasOwnProperty.call(value, property)) continue;

            if (geoProperties.includes(property)) {
              mapped[property] = parseInt(value[property]);
            } else {
              const [mode, purpose] = property.split('_');
              if (!(mode in mapped)) {
                mapped[mode] = {} as PurposeDatum;
              }

              mapped[mode][purpose] = parseInt(value[property]);
            }
          }
          this.totalData.push(mapped);
        });

        this.districts = districts;
        this.zones = zones;

        this.setState({ loading: false });

        this.updateData(
          this.state.selected,
          this.state.flowDirection,
          this.state.metric,
          this.state.geographyType,
          new Map(this.state.modes),
          new Map(this.state.purposes)
        );
      }
    );
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
    purposes: Map<string, boolean>
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
    const idToFeature = new Map<number, Feature>();
    geographies.forEach((feature: Feature) => {
      tripData.set(feature.properties.id, 0);
      idToFeature.set(feature.properties.id, feature);
    });

    let minValue = Number.MAX_SAFE_INTEGER;
    let maxValue = 0;

    let text = '';

    if (selected !== null) {
      let selectedField = destField;
      if (flowDirection === FlowDirection.DToO) {
        selectedField = originField;
      }

      // Filter data based on which geography is selected
      const odData = this.totalData.filter(
        (d: ODDatum) => d[selectedField] === selected
      );

      let sumField = originField;
      if (flowDirection === FlowDirection.DToO) {
        sumField = destField;
      }

      // Create a list of all checked entries for each filter
      const checkedModes = [];
      modes.forEach((checked: boolean, mode: string) => {
        if (checked) checkedModes.push(mode);
      });
      const checkedPurposes = [];
      purposes.forEach((checked: boolean, purpose: string) => {
        if (checked) checkedPurposes.push(purpose);
      });

      odData.forEach((datum: ODDatum) => {
        let addend = 0;

        for (const mode of checkedModes) {
          for (const purpose of checkedPurposes) {
            addend += datum[mode][purpose];
          }
        }

        // If metric is density, divide trip volume with feature area
        if (metric === Metric.Density) {
          addend /= idToFeature.get(datum[sumField]).properties.area;
        }

        tripData.set(datum[sumField], tripData.get(datum[sumField]) + addend);
      });

      tripData.forEach((volume: number) => {
        minValue = Math.min(minValue, volume);
        maxValue = Math.max(maxValue, volume);
      });

      const selectedValue = tripData.get(selected);
      text = Math.round(selectedValue).toString();
    }

    this.setState({ tripData, minValue, maxValue, tooltipText: text });
  }

  /**
   * Update which geography is selected by ID. If the geography is already
   * selected, the selection is cleared.
   * @param id {number} The ID of the geography to select.
   */
  private updateSelected(id: number): void {
    if (this.state.selected === id) {
      this.setState({ selected: null });
      this.updateData(
        null,
        this.state.flowDirection,
        this.state.metric,
        this.state.geographyType,
        new Map(this.state.modes),
        new Map(this.state.purposes)
      );
    } else {
      this.setState({ selected: id });
      this.updateData(
        id,
        this.state.flowDirection,
        this.state.metric,
        this.state.geographyType,
        new Map(this.state.modes),
        new Map(this.state.purposes)
      );
    }
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
      this.updateData(
        this.state.selected,
        FlowDirection.OToD,
        this.state.metric,
        this.state.geographyType,
        new Map(this.state.modes),
        new Map(this.state.purposes)
      );
    } else if (direction === 'do') {
      this.setState({ flowDirection: FlowDirection.DToO });
      this.updateData(
        this.state.selected,
        FlowDirection.DToO,
        this.state.metric,
        this.state.geographyType,
        new Map(this.state.modes),
        new Map(this.state.purposes)
      );
    }
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
      this.updateData(
        this.state.selected,
        this.state.flowDirection,
        Metric.Volume,
        this.state.geographyType,
        new Map(this.state.modes),
        new Map(this.state.purposes)
      );
    } else if (metric === 'density') {
      this.setState({ metric: Metric.Density });
      this.updateData(
        this.state.selected,
        this.state.flowDirection,
        Metric.Density,
        this.state.geographyType,
        new Map(this.state.modes),
        new Map(this.state.purposes)
      );
    }
  }

  /**
   * Update the geography type to use in calculations. Districts are larger
   * boundaries than zones. Each zone belongs to exactly one district.
   * @param type {string} The type of geography to use for calculations.
   */
  private updateGeographyType(type: string): void {
    // Clear current selection
    this.setState({ selected: null });

    if (type === 'district') {
      this.setState({ geographyType: GeographyType.District });
      this.updateData(
        null,
        this.state.flowDirection,
        this.state.metric,
        GeographyType.District,
        new Map(this.state.modes),
        new Map(this.state.purposes)
      );
    } else if (type === 'zone') {
      this.setState({ geographyType: GeographyType.Zone });
      this.updateData(
        null,
        this.state.flowDirection,
        this.state.metric,
        GeographyType.Zone,
        new Map(this.state.modes),
        new Map(this.state.purposes)
      );
    }
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
      new Map(this.state.purposes)
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
      cloned
    );
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
        this.updateModesFilter(entry);
      } else if (section === 'purpose') {
        this.updatePurposesFilter(entry);
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

      if (this.state.selected) {
        const value = this.state.tripData.get(id);
        text = Math.round(value).toString();
      }
    }

    this.setState({ hovered: id, tooltipText: text, hoverX: x, hoverY: y });
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
          onEntryClicked={(
            control: string,
            section: string,
            entry: string
          ): void => {
            this.handleEntryClicked(control, section, entry);
          }}
        />
        <Tooltip
          text={this.state.tooltipText}
          x={this.state.hoverX}
          y={this.state.hoverY}
        />
        <LoadingScreen loading={this.state.loading} />
      </div>
    );
  }
}
