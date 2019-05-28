import Model from '../superclasses/Model';

/**
 * Model that stores and controls the app's data and state.
 */
export default class AppModel extends Model {
  // eslint-disable-next-line
  constructor() {
    super();

    this.selected = null;

    this.controlPanel = {
      district: '',
      iteration: 0,
      autoIterate: false,
      clusters: 30,
      dataset: 'total',
      purpose: 'work',
    };
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
