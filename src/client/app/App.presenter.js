import Presenter from '../superclasses/Presenter';
import MapView from '../components/map/Map.view';
import MapPresenter from '../components/map/Map.presenter';
import ControlPanelView from '../components/control-panel/ControlPanel.view';
import ControlPanelPresenter
  from '../components/control-panel/ControlPanel.presenter';

// eslint-disable-next-line
export default class AppPresenter extends Presenter {
  /**
   * @param {AppModel} model
   * @param {View} view
   */
  constructor(model, view) {
    super(model, view);

    this.mapView = new MapView(document.getElementById('map'));
    new MapPresenter(this.model, this.mapView);

    this.controlPanelView = new ControlPanelView(
        document.getElementById('control-panel')
    );
    new ControlPanelPresenter(this.model, this.controlPanelView);
  }
}
