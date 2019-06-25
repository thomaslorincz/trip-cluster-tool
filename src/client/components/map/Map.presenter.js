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

    document.addEventListener('addFlowLines', (event) => {
      this.view.addFlowLines(event.detail);
    });

    document.addEventListener('removeFlowLines', () => {
      this.view.removeFlowLines();
    });

    document.addEventListener('addClusters', (event) => {
      this.view.addClusters(event.detail);
    });

    document.addEventListener('removeClusters', () => {
      this.view.removeClusters();
    });

    document.addEventListener('boundaryUpdated', (event) => {
      this.view.updateBoundary(event.detail);
    });

    this.view.container.addEventListener('featureClicked', (event) => {
      this.model.geographySelected(event.detail);
    });

    this.view.container.addEventListener('lineClicked', (event) => {
      this.model.lineSelected(event.detail);
    });
  }
}
