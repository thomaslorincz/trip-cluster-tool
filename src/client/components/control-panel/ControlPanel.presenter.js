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

    document.addEventListener('controlsUpdated', (event) => {
      this.view.draw(event.detail);
    });

    this.view.container.addEventListener('nextIterationClicked', () => {
      this.model.nextIteration();
    });

    this.view.container.addEventListener('autoIterateClicked', () => {
      this.model.autoIterate();
    });

    this.view.container.addEventListener('decrementClicked', () => {
      this.model.decrementFlowLines();
    });

    this.view.container.addEventListener('incrementClicked', () => {
      this.model.incrementFlowLines();
    });

    this.view.container.addEventListener('boundaryClicked', (event) => {
      this.model.updateBoundary(event.detail);
    });

    this.view.container.addEventListener('modeClicked', (event) => {
      this.model.updateMode(event.detail);
    });

    this.view.container.addEventListener('purposeClicked', (event) => {
      this.model.updatePurpose(event.detail);
    });
  }
}
