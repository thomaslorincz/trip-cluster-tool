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
  zones: Feature[];
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
    const { zones } = this.props;

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
            lineWidthScale: 20,
            lineWidthMinPixels: 1,
            getFillColor: [255, 255, 255, 40],
            getRadius: 100,
            getLineWidth: 1,
            onHover: (info): void => {
              this.setState({
                hoveredObject: info.object,
                pointerX: info.x,
                pointerY: info.y
              });
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
