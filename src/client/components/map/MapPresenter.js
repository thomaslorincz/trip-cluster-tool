import Presenter from '../../superclasses/Presenter';

/**
 * A presenter that converts events from the MapView into actions in the
 * AppModel.
 */
export default class MapPresenter extends Presenter {
  /**
   * @param {AppModel} model
   * @param {MapView} view
   * @param {EventEmitter} emitter
   */
  constructor(model, view, emitter) {
    super(model, view, emitter);

    this.emitter.on('districtClicked', (id) => {
      this.model.geographySelected(id, 'district');
    });

    this.emitter.on('zoneClicked', (id) => {
      this.model.geographySelected(id, 'zone');
    });

    this.emitter.on('lineClicked', (key, weight) => {
      this.model.lineSelected(key, weight);
    });
  }
}
