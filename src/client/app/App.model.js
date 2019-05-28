import Model from '../superclasses/Model';
import totalDataPath from '../../../data/result_total.csv';
import transitDataPath from '../../../data/result_transit.csv';
import * as d3 from 'd3';

/**
 * Model that stores and controls the app's data and state.
 */
export default class AppModel extends Model {
  // eslint-disable-next-line
  constructor() {
    super();

    this.dataLoaded = false;

    this.selected = null;

    this.controlPanel = {
      district: '',
      iteration: 0,
      autoIterate: false,
      clusters: 30,
      dataset: 'total',
      purpose: 'work',
    };

    this.totalData = null;
    this.transitData = null;

    Promise.all([
      d3.csv(totalDataPath),
      d3.csv(transitDataPath),
    ]).then(([totalData, transitData]) => {
      this.totalData = totalData;
      this.transitData = transitData;
      this.dataLoaded = true;
    }).catch((error) => {
      console.log(error);
    });
  }

  /**
   * @param {object} settings
   * @param {string} settings.district
   * @param {number} settings.iteration
   * @param {boolean} settings.autoIterate
   * @param {number} settings.clusters
   * @param {string} settings.dataset
   * @param {string} settings.purpose
   */
  updateControlPanel(settings) {
    this.controlPanel = {...settings};
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
  }

  /**
   * @param {number} districtId
   */
  updateSelected(districtId) {
    this.selected = districtId;
    this.controlPanel.district = districtId.toString();
    document.dispatchEvent(new CustomEvent('selectedUpdated', {
      detail: this.selected,
    }));
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
  }
}
