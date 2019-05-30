import View from '../../superclasses/View';
import mapboxgl from 'mapbox-gl';
import proj4 from 'proj4';

/**
 * A view that represents an interactive map.
 */
export default class MapView extends View {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super(container);

    proj4.defs([
      [
        'EPSG:4326',
        '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +un' +
        'its=degrees',
      ],
      [
        'EPSG:3776',
        '+proj=tmerc +lat_0=0 +lon_0=-114 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS8' +
        '0 +datum=NAD83 +units=m +no_defs',
      ],
    ]);

    mapboxgl.accessToken = 'pk.eyJ1IjoidGhvbWFzbG9yaW5jeiIsImEiOiJjamx5aXVwaH' +
      'AxamZzM3dsaWdkZ3Q2eGJyIn0.mXjlp9c3l2-NBoS1uaEUdw';

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v9',
      center: [-113.323975, 53.631611],
      zoom: 7,
    });

    this.map.dragRotate.disable();
    this.map.touchZoomRotate.disable();

    this.lineLayers = [];

    this.map.on('load', () => {
      this.map.addLayer({
        'id': 'districtLayer',
        'source': {
          type: 'vector',
          url: 'mapbox://thomaslorincz.7qoflzqc',
        },
        'source-layer': 'district1669-5c4o7a',
        'type': 'fill',
        'paint': {
          'fill-color': 'rgba(0,0,255,0.5)',
          'fill-outline-color': 'rgba(0,0,255,0.2)',
        },
      });

      this.map.addLayer({
        'id': 'districtLayerSelected',
        'source': {
          type: 'vector',
          url: 'mapbox://thomaslorincz.7qoflzqc',
        },
        'source-layer': 'district1669-5c4o7a',
        'type': 'line',
        'feature_type': 'fill',
        'paint': {
          'line-width': 6,
          'line-color': 'black',
        },
        'filter': ['in', 'District', ''],
      });

      this.map.on('click', 'districtLayer', (e) => {
        const features = this.map.queryRenderedFeatures(
            e.point,
            'districtLayer'
        );
        if (features.length > 0) {
          const thisLayerFeatures = features.filter((d) => {
            return d.layer.id === 'districtLayer';
          });
          const feature = thisLayerFeatures[0];
          this.container.dispatchEvent(new CustomEvent('featureClicked', {
            detail: feature.properties['District'],
          }));
        }
      });

      this.map.on('mouseenter', 'districtLayer', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', 'districtLayer', () => {
        this.map.getCanvas().style.cursor = '';
      });
    });
  }

  /**
   * @param {[]} line
   * @param {number} min The minimum magnitude (used for line styling)
   * @param {number} max The maximum magnitude (used for line styling)
   */
  addFlowLine({line, min, max}) {
    const origin = proj4('EPSG:3776', 'EPSG:4326', [line[0], line[1]]);
    const dest = proj4('EPSG:3776', 'EPSG:4326', [line[2], line[3]]);

    this.lineLayers.push(line[5]);

    this.map.addLayer({
      'id': line[5],
      'type': 'line',
      'source': {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {
            'magnitude': line[4],
            'base-width': Math.max(2000 * ((line[4] - min) / (max - min)), 100),
          },
          'geometry': {
            'type': 'LineString',
            'coordinates': [origin, dest],
          },
        },
      },
      'paint': {
        'line-color': [
          'interpolate', ['linear'], ['get', 'magnitude'],
          min, '#ffffff',
          max, '#ff0000',
        ],
        'line-width': [
          'interpolate', ['exponential', 2], ['zoom'],
          0, ['*', ['get', 'base-width'], ['^', 2, -16]],
          24, ['*', ['get', 'base-width'], ['^', 2, 8]],
        ],
        'line-opacity': 0.8,
      },
    });

    this.map.addLayer({
      'id': `${line[5]}-arrows`,
      'type': 'symbol',
      'source': line[5],
      'layout': {
        'symbol-placement': 'line',
        'symbol-spacing': 50,
        'icon-image': 'triangle-15',
        'icon-rotation-alignment': 'map',
        'icon-rotate': 90,
      },
    });
  }

  /**
   * Removes all drawn lines
   */
  removeFlowLines() {
    this.lineLayers.forEach((id) => {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }

      if (this.map.getLayer(`${id}-arrows`)) {
        this.map.removeLayer(`${id}-arrows`);
      }

      if (this.map.getSource(id)) {
        this.map.removeSource(id);
      }
    });
  }

  /**
   * @param {number} districtId
   */
  updateSelected(districtId) {
    this.map.setFilter('districtLayerSelected', ['in', 'District', districtId]);
  }
}
