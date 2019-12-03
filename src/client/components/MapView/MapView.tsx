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

interface MapViewProps {
  onClick: Function;
  onHover: Function;
  selected: number;
  hovered: number;
  zones: Feature[];
  cursor: string;
}

interface MapViewState {
  hoveredObject: Feature;
  pointerX: number;
  pointerY: number;
}

export class MapView extends React.Component<MapViewProps, MapViewState> {
  public componentDidMount(): void {
    document
      .getElementById('deckgl-wrapper')
      .addEventListener('contextmenu', event => event.preventDefault());
  }

  private renderTooltip(): React.ReactNode {
    const { hoveredObject, pointerX, pointerY } = this.state || {};
    return (
      hoveredObject && (
        <div
          style={{
            position: 'absolute',
            zIndex: 1,
            pointerEvents: 'none',
            left: pointerX,
            top: pointerY
          }}
        >
          {hoveredObject.properties.id}
        </div>
      )
    );
  }

  public render(): React.ReactNode {
    const { selected, hovered, zones, cursor } = this.props;

    return (
      <DeckGL
        layers={[
          new GeoJsonLayer({
            id: 'zones',
            data: zones,
            pickable: true,
            stroked: true,
            filled: true,
            extruded: false,
            lineWidthScale: 1,
            lineWidthMinPixels: 1,
            getLineColor: [0, 0, 0, 255],
            getFillColor: (f: Feature): number[] => {
              if (f.properties.id === selected) {
                return [0, 0, 255, 200];
              } else {
                return [255, 255, 255, 40];
              }
            },
            getLineWidth: 2,
            updateTriggers: {
              getFillColor: [selected]
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
            id: 'hovered',
            data: zones,
            pickable: false,
            stroked: true,
            filled: false,
            extruded: false,
            lineWidthScale: 1,
            lineWidthMinPixels: 1,
            getLineColor: (f: Feature): number[] => {
              if (f.properties.id === hovered) {
                return [255, 255, 255, 255];
              } else {
                return [255, 255, 255, 0];
              }
            },
            getLineWidth: 4,
            updateTriggers: {
              getLineColor: [hovered]
            }
          })
        ]}
        initialViewState={{
          longitude: -113.4938,
          latitude: 53.5461,
          zoom: 11,
          pitch: 45,
          bearing: 0
        }}
        controller={true}
        getCursor={(): string => cursor}
      >
        <StaticMap
          reuseMaps
          mapStyle="mapbox://styles/mapbox/dark-v9"
          preventStyleDiffing={true}
          mapboxApiAccessToken={process.env.MAPBOX_TOKEN}
        />
        {this.renderTooltip()}
      </DeckGL>
    );
  }
}
