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

    this.linesDrawn = false;
    this.clustersDrawn = false;

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
          'fill-color': 'rgba(0,0,255,0.3)',
          'fill-outline-color': 'rgba(0,0,255,0.4)',
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

      this.map.on('click', (event) => {
        const districts = this.map.queryRenderedFeatures(
            event.point,
            'districtLayer'
        );
        const lines = this.map.queryRenderedFeatures(event.point, 'lineLayer');

        if (this.linesDrawn && lines.length > 0) {
          const thisLayerFeatures = districts.filter((d) => {
            return d.layer.id === 'lineLayer';
          });
          const feature = thisLayerFeatures[0];
          if (feature) {
            this.container.dispatchEvent(new CustomEvent('lineClicked', {
              detail: feature.properties['key'],
            }));
            return;
          }
        }

        if (districts.length > 0) {
          const thisLayerFeatures = districts.filter((d) => {
            return d.layer.id === 'districtLayer';
          });
          const feature = thisLayerFeatures[0];
          if (feature) {
            this.container.dispatchEvent(new CustomEvent('featureClicked', {
              detail: feature.properties['District'],
            }));
          }
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
   * @param {FlowLine[]} line
   * @param {number} min - The minimum magnitude (used for line styling)
   * @param {number} max - The maximum magnitude (used for line styling)
   */
  addFlowLines({lines, min, max}) {
    let colourStyling = null;

    const data = {
      'type': 'FeatureCollection',
      'features': [],
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      let baseWidth = null;
      if (min === max) {
        colourStyling = '#ff0000';
        baseWidth = 1000;
      } else {
        colourStyling = [
          'interpolate', ['linear'], ['get', 'magnitude'],
          min, '#ffffff',
          max, '#ff0000',
        ];
        baseWidth = Math.max(1000 * ((line.weight - min) / (max - min)), 200);
      }

      data.features.push({
        'type': 'Feature',
        'properties': {
          'key': line.key,
          'magnitude': line.weight,
          'base-width': baseWidth,
        },
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            proj4('EPSG:3776', 'EPSG:4326', [line.originX, line.originY]),
            proj4('EPSG:3776', 'EPSG:4326', [line.destX, line.destY]),
          ],
        },
      });
    }

    this.map.addLayer({
      'id': 'lineLayer',
      'type': 'line',
      'source': {
        'type': 'geojson',
        'data': data,
      },
      'paint': {
        'line-color': colourStyling,
        'line-width': [
          'interpolate', ['exponential', 2], ['zoom'],
          0, ['*', ['get', 'base-width'], ['^', 2, -16]],
          24, ['*', ['get', 'base-width'], ['^', 2, 8]],
        ],
        'line-opacity': 0.8,
      },
    });

    this.linesDrawn = true;
  }

  /**
   * Removes all drawn lines
   */
  removeFlowLines() {
    if (this.linesDrawn) {
      this.map.removeLayer('lineLayer');
      this.map.removeSource('lineLayer');
      this.linesDrawn = false;
    }
  }

  /**
   * @param {string} lineKey
   * @param {FlowLine[]} clusters
   */
  addClusters({lineKey, clusters}) {
    this.map.setFilter('lineLayer', ['in', 'key', lineKey]);

    const originData = {
      'type': 'FeatureCollection',
      'features': [],
    };

    const destData = {
      'type': 'FeatureCollection',
      'features': [],
    };

    for (let i = 0; i < clusters.length; i++) {
      const cluster = clusters[i];

      originData.features.push({
        'type': 'Feature',
        'properties': {
          'magnitude': cluster.weight,
        },
        'geometry': {
          'type': 'Point',
          'coordinates': proj4(
              'EPSG:3776', 'EPSG:4326',
              [cluster.originX, cluster.originY],
          ),
        },
      });

      destData.features.push({
        'type': 'Feature',
        'properties': {
          'magnitude': cluster.weight,
        },
        'geometry': {
          'type': 'Point',
          'coordinates': proj4(
              'EPSG:3776', 'EPSG:4326',
              [cluster.destX, cluster.destY],
          ),
        },
      });
    }

    this.map.addLayer({
      'id': 'originLayer',
      'type': 'circle',
      'source': {
        'type': 'geojson',
        'data': originData,
      },
      'paint': {
        'circle-color': '#FFFF00',
        'circle-radius': ['/', ['get', 'magnitude'], 2],
        'circle-opacity': 0.8,
      },
    });

    this.map.addLayer({
      'id': 'destLayer',
      'type': 'circle',
      'source': {
        'type': 'geojson',
        'data': destData,
      },
      'paint': {
        'circle-color': '#00FF00',
        'circle-radius': ['/', ['get', 'magnitude'], 2],
        'circle-opacity': 0.8,
      },
    });

    this.clustersDrawn = true;
  }

  /**
   * Removes all drawn cluster circles
   */
  removeClusters() {
    if (this.clustersDrawn) {
      this.map.removeLayer('originLayer');
      this.map.removeSource('originLayer');
      this.map.removeLayer('destLayer');
      this.map.removeSource('destLayer');
      this.clustersDrawn = false;
      this.map.setFilter('lineLayer', null);
    }
  }

  /**
   * @param {number} districtId
   */
  updateSelected(districtId) {
    this.map.setFilter('districtLayerSelected', ['in', 'District', districtId]);
  }
}
