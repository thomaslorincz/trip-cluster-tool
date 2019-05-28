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
      const newSettings = {...this.model.controlPanel};
      newSettings.iteration++;
      this.model.updateControlPanel(newSettings);
    });

    this.view.container.addEventListener('autoIterateClicked', () => {
      const newSettings = {...this.model.controlPanel};
      newSettings.autoIterate = !this.model.controlPanel.autoIterate;
      this.model.updateControlPanel(newSettings);
    });

    this.view.container.addEventListener('clusterInput', (event) => {
      const newSettings = {...this.model.controlPanel};
      newSettings.clusters = event.detail;
      this.model.updateControlPanel(newSettings);
    });

    this.view.container.addEventListener('runAgainClicked', () => {
      console.log('Run Again Clicked');
    });

    this.view.container.addEventListener('datasetClicked', (event) => {
      const newSettings = {...this.model.controlPanel};
      newSettings.dataset = event.detail;
      this.model.updateControlPanel(newSettings);
    });

    this.view.container.addEventListener('purposeClicked', (event) => {
      const newSettings = {...this.model.controlPanel};
      newSettings.purpose = event.detail;
      this.model.updateControlPanel(newSettings);
    });
  }
}
