import * as React from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapView.css';

export class MapView extends React.Component<{}, {}> {
  public render(): React.ReactNode {
    return <div className="map" />;
  }
}
