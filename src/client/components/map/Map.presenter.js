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

    document.addEventListener('selectedUpdated', (event) => {
      this.view.updateSelected(event.detail);
    });

    document.addEventListener('addFlowLine', (event) => {
      this.view.addFlowLine(event.detail);
    });

    document.addEventListener('removeFlowLines', () => {
      this.view.removeFlowLines();
    });

    this.view.container.addEventListener('featureClicked', (event) => {
      this.model.geographySelected(event.detail);
    });
  }
}
