import Model from '../superclasses/Model';

/**
 * Model that stores and controls the app's data and state.
 */
export default class AppModel extends Model {
  // eslint-disable-next-line
  constructor() {
    super();

    this.selected = null;
  }

  /**
   * @param {number} districtId
   */
  updateSelected(districtId) {
    this.selected = districtId;
    document.dispatchEvent(new CustomEvent('selectedUpdated', {
      detail: this.selected,
    }));
  }
}
