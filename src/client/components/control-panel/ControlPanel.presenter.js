import Presenter from '../../superclasses/Presenter';

/**
 * A presenter that converts events from the ControlPanelView into actions in
 * the AppModel.
 */
export default class ControlPanelPresenter extends Presenter {
  /**
   * @param {AppModel} model
   * @param {ControlPanelView} view
   */
  constructor(model, view) {
    super(model, view);
  }
}
