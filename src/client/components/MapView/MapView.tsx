import * as React from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';

import DeckGL from '@deck.gl/react';
import { StaticMap } from 'react-map-gl';

export class MapView extends React.Component<{}, {}> {
  public componentDidMount(): void {
    document
      .getElementById('deckgl-wrapper')
      .addEventListener('contextmenu', event => event.preventDefault());
  }

  public render(): React.ReactNode {
    return (
      <DeckGL
        layers={[]}
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
      </DeckGL>
    );
  }
}
