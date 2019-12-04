import * as React from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';

import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { StaticMap } from 'react-map-gl';

export interface Feature {
  type: string;
  properties: { id: number };
  geometry: { type: string; coordinates: number[] };
}

interface Props {
  onClick: Function;
  onHover: Function;
  selected: number;
  hovered: number;
  boundaries: Feature[];
  tripVolume: Map<number, number>;
  minVolume: number;
  maxVolume: number;
  cursor: string;
}

export class MapView extends React.Component<Props, {}> {
  // http://colorbrewer2.org/#type=sequential&scheme=RdPu&n=9
  private colourRange = [
    [255, 255, 255, 40], // Base colour
    [255, 247, 243, 80], // #fff7f3
    [253, 224, 221, 80], // #fde0dd
    [252, 197, 192, 80], // #fcc5c0
    [250, 159, 181, 80], // '#fa9fb5',
    [247, 104, 161, 80], // '#f768a1',
    [221, 52, 151, 80], // #dd3497
    [174, 1, 126, 80], // '#ae017e',
    [122, 1, 119, 80], // '#7a0177',
    [73, 0, 106, 80] // '#49006a'
  ];

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
      const index = Math.round(((volume - min) / (max - min)) * 9);
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
      tripVolume,
      minVolume,
      maxVolume,
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
                tripVolume.get(f.properties.id),
                minVolume,
                maxVolume
              );
            },
            getLineWidth: 2,
            updateTriggers: {
              getFillColor: [tripVolume, minVolume, maxVolume]
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
      </DeckGL>
    );
  }
}
