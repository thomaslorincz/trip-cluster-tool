import * as React from 'react';
import './MapView.css';

import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';

export interface Feature {
  type: string;
  properties: { id: number; area: number };
  geometry: { type: string; coordinates: number[] };
}

interface Props {
  onClick: Function;
  onHover: Function;
  selected: number;
  hovered: number;
  boundaries: Feature[];
  tripData: Map<number, number>;
  minValue: number;
  maxValue: number;
  cursor: string;
}

interface State {
  hovered: Feature;
  hoverX: number;
  hoverY: number;
}

export class MapView extends React.Component<Props, State> {
  // http://colorbrewer2.org/#type=sequential&scheme=RdPu&n=7
  private colourRange = [
    [254, 235, 226, 160], // #feebe2
    [252, 197, 192, 160], // #fcc5c0
    [250, 159, 181, 160], // #fa9fb5
    [247, 104, 161, 160], // #f768a1,
    [221, 52, 151, 160], // #dd3497
    [174, 1, 126, 160], // ae017e
    [122, 1, 119, 160] // #7a0177,
  ];

  constructor(props: Props) {
    super(props);
    this.state = {
      hovered: {} as Feature,
      hoverX: 0,
      hoverY: 0
    };
  }

  public componentDidMount(): void {
    // Prevent a context menu from appearing on right-click
    document
      .getElementById('deckgl-wrapper')
      .addEventListener('contextmenu', event => event.preventDefault());
  }

  /**
   * Convert trip volume to choropleth colour.
   * @param volume {number} The number of trips to/from (depending on flow
   *     direction) the selected geography.
   * @param min {number} The minimum (nonzero) trip volume to use in scaling.
   * @param max {number} The maximum trip volume to use in scaling.
   */
  private volumeToColour(volume: number, min: number, max: number): number[] {
    if (volume) {
      let index = Math.round(
        ((volume - min) / (max - min)) * (this.colourRange.length - 1)
      );

      if (isNaN(index)) {
        index = this.colourRange.length - 1;
      }

      return this.colourRange[index];
    } else {
      return [255, 255, 255, 40];
    }
  }

  private renderTooltip(feature: Feature): React.ReactNode {
    const { tripData } = this.props;

    let text = '';
    if (feature && feature.properties) {
      text = Math.round(tripData.get(feature.properties.id)).toString();
    }

    return (
      <div
        className="tooltip"
        style={{
          display: text ? 'block' : 'none',
          left: this.state.hoverX - (6 + (text.length / 2) * 8),
          top: this.state.hoverY - 28
        }}
      >
        {text}
      </div>
    );
  }

  public render(): React.ReactNode {
    const {
      selected,
      hovered,
      boundaries,
      tripData,
      minValue,
      maxValue,
      cursor
    } = this.props;

    return (
      <React.Fragment>
        <DeckGL
          layers={[
            new GeoJsonLayer({
              id: 'boundaries',
              data: boundaries,
              pickable: true,
              stroked: true,
              filled: true,
              extruded: false,
              lineWidthScale: 1,
              lineWidthMinPixels: 1,
              getLineColor: [0, 0, 0, 255],
              getFillColor: (f: Feature): number[] => {
                return this.volumeToColour(
                  tripData.get(f.properties.id),
                  minValue,
                  maxValue
                );
              },
              getLineWidth: 2,
              updateTriggers: {
                getFillColor: [tripData, minValue, maxValue]
              },
              onClick: (info): void => {
                this.props.onClick(info.object.properties.id);
              },
              onHover: (info): void => {
                this.setState({
                  hovered: info.object,
                  hoverX: info.x,
                  hoverY: info.y
                });
                if (info.object) {
                  this.props.onHover(info.object.properties.id);
                } else {
                  this.props.onHover(null);
                }
              }
            }),
            new GeoJsonLayer({
              id: 'outline',
              data: boundaries,
              pickable: false,
              stroked: true,
              filled: true,
              extruded: false,
              lineWidthScale: 1,
              lineWidthMinPixels: 4,
              getFillColor: (f: Feature): number[] => {
                if (f.properties.id === hovered) {
                  return [0, 0, 255, 40];
                } else {
                  return [255, 255, 255, 0];
                }
              },
              getLineColor: (f: Feature): number[] => {
                if (f.properties.id === selected) {
                  return [0, 0, 255, 255];
                } else {
                  return [255, 255, 255, 0];
                }
              },
              getLineWidth: 4,
              updateTriggers: {
                getFillColor: [hovered],
                getLineColor: [selected]
              }
            })
          ]}
          initialViewState={{
            longitude: -113.4938,
            latitude: 53.5461,
            zoom: 8,
            pitch: 0,
            bearing: 0
          }}
          controller={true}
          getCursor={(): string => cursor}
        >
          <StaticMap
            mapStyle="mapbox://styles/mapbox/dark-v9"
            preventStyleDiffing={true}
            mapboxApiAccessToken={process.env.MAPBOX_TOKEN}
          />
        </DeckGL>
        {this.renderTooltip(this.state.hovered)}
      </React.Fragment>
    );
  }
}
