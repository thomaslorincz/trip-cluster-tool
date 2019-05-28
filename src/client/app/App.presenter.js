import Presenter from '../superclasses/Presenter';

// eslint-disable-next-line
export default class AppPresenter extends Presenter {
  /**
   * @param {AppModel} model
   * @param {View} view
   */
  constructor(model, view) {
    super(model, view);
  }
}
