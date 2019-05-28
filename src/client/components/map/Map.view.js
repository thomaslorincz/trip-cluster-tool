import View from '../../superclasses/View';
import mapboxgl from 'mapbox-gl';

/**
 * A view that represents an interactive map.
 */
export default class MapView extends View {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super(container);

    mapboxgl.accessToken = 'pk.eyJ1IjoidGhvbWFzbG9yaW5jeiIsImEiOiJjamx5aXVwaH' +
      'AxamZzM3dsaWdkZ3Q2eGJyIn0.mXjlp9c3l2-NBoS1uaEUdw';

    this.map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/light-v9',
      center: [-113.323975, 53.631611],
      zoom: 7,
    });

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
   * @param {number} districtId
   */
  updateSelected(districtId) {
    this.map.setFilter('districtLayerSelected', ['in', 'District', districtId]);
  }
}
