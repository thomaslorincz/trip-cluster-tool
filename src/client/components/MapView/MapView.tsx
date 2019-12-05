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

export class MapView extends React.Component<Props, {}> {
  // http://colorbrewer2.org/#type=sequential&scheme=RdPu&n=5
  private colourRange = [
    [254, 235, 226, 80], // #feebe2
    [251, 180, 185, 120], // #fbb4b9
    [247, 104, 161, 160], // #f768a1,
    [197, 27, 138, 200], // #c51b8a
    [122, 1, 119, 240] // #7a0177,
  ];

  public componentDidMount(): void {
    // Prevent a context menu from appearing on right-click
    document
      .getElementById('deckgl-wrapper')
      .addEventListener('contextmenu', event => event.preventDefault());
  }

  /**
   * Render the tooltip based on what is currently hovered.
   */
  private renderTooltip(): React.ReactNode {
    return <div className="tooltip" />;
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
        {this.renderTooltip()}
      </DeckGL>
    );
  }
}
