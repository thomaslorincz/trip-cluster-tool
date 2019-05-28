import Presenter from '../../superclasses/Presenter';

/**
 * A presenter that converts events from the MapView into actions in the
 * AppModel.
 */
export default class MapPresenter extends Presenter {
  /**
   * @param {AppModel} model
   * @param {MapView} view
   */
  constructor(model, view) {
    super(model, view);
  }
}
