import View from '../../superclasses/View';
import mapboxgl from 'mapbox-gl';
import proj4 from 'proj4';
import * as d3 from 'd3-fetch';

/** A view that represents an interactive map. */
export default class MapView extends View {
  /** @param {HTMLElement} container */
  constructor(container) {
    super(container);

    proj4.defs([
      [
        'EPSG:4326',
        '+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +unit'
        + 's=degrees',
      ],
      [
        'EPSG:3776',
        '+proj=tmerc +lat_0=0 +lon_0=-114 +k=0.9999 +x_0=0 +y_0=0 +ellps=GRS80 '
        + '+datum=NAD83 +units=m +no_defs',
      ],
    ]);

    mapboxgl.accessToken = 'pk.eyJ1IjoidGhvbWFzbG9yaW5jeiIsImEiOiJjamx5aXVwaHAx'
        + 'amZzM3dsaWdkZ3Q2eGJyIn0.mXjlp9c3l2-NBoS1uaEUdw';

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/thomaslorincz/cjx0png073khh1cpap7m6449e',
      center: [-113.323975, 53.631611],
      zoom: 7,
    });

    this.map.dragRotate.disable();

    this.districtsDrawn = true;
    this.zonesDrawn = false;

    this.linesDrawn = false;
    this.clustersDrawn = false;

    this.map.on('load', () => {
      d3.image('assets/images/chevron-32x32.png').then((imageData) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageData, 0, 0);
        this.map.addImage('chevron', {
          width: 32,
          height: 32,
          data: ctx.getImageData(0, 0, 32, 32).data,
        });
      });

      this.map.addLayer({
        'id': 'districts',
        'source': {
          type: 'vector',
          url: 'mapbox://thomaslorincz.6qk86ot5',
        },
        'source-layer': 'district-btbn5v',
        'type': 'fill',
        'paint': {
          'fill-color': 'rgba(0,0,0,0)',
          'fill-outline-color': 'rgba(0,255,255,1)',
        },
      });

      this.map.addLayer({
        'id': 'selectedDistrict',
        'source': {
          type: 'vector',
          url: 'mapbox://thomaslorincz.6qk86ot5',
        },
        'source-layer': 'district-btbn5v',
        'type': 'line',
        'feature_type': 'fill',
        'paint': {
          'line-width': 6,
          'line-color': 'rgba(255,0,255,1)',
        },
        'filter': ['in', 'District', -1],
      });

      this.map.addLayer({
        'id': 'zones',
        'source': {
          type: 'vector',
          url: 'mapbox://thomaslorincz.2jka2r5b',
        },
        'source-layer': 'TAZ-6swaau',
        'type': 'fill',
        'paint': {
          'fill-color': 'rgba(0,0,0,0)',
          'fill-outline-color': 'rgba(0,255,255,1)',
        },
      });

      this.map.addLayer({
        'id': 'selectedZone',
        'source': {
          type: 'vector',
          url: 'mapbox://thomaslorincz.2jka2r5b',
        },
        'source-layer': 'TAZ-6swaau',
        'type': 'line',
        'feature_type': 'fill',
        'paint': {
          'line-width': 6,
          'line-color': 'rgba(255,0,255,1)',
        },
        'filter': ['in', 'TAZ_New', -1],
      });

      this.map.on('click', (event) => {
        const districts = this.map.queryRenderedFeatures(
            event.point,
            'districts'
        );
        const zones = this.map.queryRenderedFeatures(event.point, 'zones');
        const lines = this.map.queryRenderedFeatures(event.point, 'lineLayer');

        if (this.linesDrawn && lines.length > 0) {
          const thisLayerFeatures = districts.filter((d) => {
            return d.layer.id === 'lineLayer';
          });
          const feature = thisLayerFeatures[0];
          if (feature) {
            this.container.dispatchEvent(new CustomEvent('lineClicked', {
              detail: {
                lineKey: feature.properties['key'],
                lineWeight: feature.properties['magnitude'],
              },
            }));
            return;
          }
        }

        if (this.districtsDrawn && districts.length > 0) {
          const thisLayerFeatures = districts.filter((d) => {
            return d.layer.id === 'districts';
          });
          const feature = thisLayerFeatures[0];
          if (feature) {
            this.container.dispatchEvent(new CustomEvent('featureClicked', {
              detail: {
                id: feature.properties['District'],
                type: 'district',
              },
            }));
          }
        } else if (this.zonesDrawn && zones.length > 0) {
          const thisLayerFeatures = districts.filter((d) => {
            return d.layer.id === 'zones';
          });
          const feature = thisLayerFeatures[0];
          if (feature) {
            this.container.dispatchEvent(new CustomEvent('featureClicked', {
              detail: {
                id: feature.properties['TAZ_New'],
                type: 'zone',
              },
            }));
          }
        }
      });

      this.map.on('mouseenter', 'districts', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', 'districts', () => {
        this.map.getCanvas().style.cursor = '';
      });

      this.map.on('mouseenter', 'zones', () => {
        this.map.getCanvas().style.cursor = 'pointer';
      });

      this.map.on('mouseleave', 'zones', () => {
        this.map.getCanvas().style.cursor = '';
      });

      this.updateBoundary('district');
    });
  }

  /**
   * @param {FlowLine[]} line
   * @param {number} min - The minimum magnitude (used for line styling)
   * @param {number} max - The maximum magnitude (used for line styling)
   */
  addFlowLines({lines, min, max}) {
    const data = {
      'type': 'FeatureCollection',
      'features': [],
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      let baseWidth = null;
      if (min === max) {
        baseWidth = 1000;
      } else {
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
        'line-color': '#FF0000',
        'line-width': [
          'interpolate', ['exponential', 2], ['zoom'],
          0, ['*', ['get', 'base-width'], ['^', 2, -16]],
          24, ['*', ['get', 'base-width'], ['^', 2, 8]],
        ],
        'line-opacity': 0.8,
      },
    });

    this.map.addLayer({
      'id': 'lineArrows',
      'type': 'symbol',
      'source': 'lineLayer',
      'layout': {
        'symbol-placement': 'line',
        'symbol-spacing': 100,
        'icon-image': 'chevron',
        'icon-rotation-alignment': 'map',
        'icon-rotate': 90,
        'icon-ignore-placement': true,
      },
    });

    this.linesDrawn = true;
  }

  /**
   * Removes all drawn lines
   */
  removeFlowLines() {
    if (this.linesDrawn) {
      this.map.removeLayer('lineArrows');
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
    this.map.setFilter('lineArrows', ['in', 'key', lineKey]);

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
          'magnitude': Math.max(cluster.weight * 10, 32),
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
          'magnitude': Math.max(cluster.weight * 10, 32),
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
        'circle-radius': [
          'interpolate', ['exponential', 2], ['zoom'],
          0, ['*', ['get', 'magnitude'], ['^', 2, -16]],
          24, ['*', ['get', 'magnitude'], ['^', 2, 8]],
        ],
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
        'circle-radius': [
          'interpolate', ['exponential', 2], ['zoom'],
          0, ['*', ['get', 'magnitude'], ['^', 2, -16]],
          24, ['*', ['get', 'magnitude'], ['^', 2, 8]],
        ],
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
      this.map.setFilter('lineArrows', null);
    }
  }

  /**
   * @param {'district'|'zone'} type
   */
  updateBoundary(type) {
    if (type === 'district') {
      this.map.setLayoutProperty('districts', 'visibility', 'visible');
      this.map.setLayoutProperty('selectedDistrict', 'visibility', 'visible');
      this.map.setLayoutProperty('zones', 'visibility', 'none');
      this.map.setLayoutProperty('selectedZone', 'visibility', 'none');
      this.districtsDrawn = true;
      this.zonesDrawn = false;
    } else if (type === 'zone') {
      this.map.setLayoutProperty('districts', 'visibility', 'none');
      this.map.setLayoutProperty('selectedDistrict', 'visibility', 'none');
      this.map.setLayoutProperty('zones', 'visibility', 'visible');
      this.map.setLayoutProperty('selectedZone', 'visibility', 'visible');
      this.zonesDrawn = true;
      this.districtsDrawn = false;
    }
  }

  /**
   * @param {number} id
   */
  updateSelected(id) {
    console.log(id);
    if (this.districtsDrawn) {
      this.map.setFilter('selectedDistrict', ['in', 'District', id]);
    } else if (this.zonesDrawn) {
      this.map.setFilter('selectedZone', ['in', 'TAZ_New', id]);
    }
  }
}
