import Presenter from '../superclasses/Presenter';
import MapView from '../components/map/Map.view';
import MapPresenter from '../components/map/Map.presenter';
import ControlPanelView from '../components/control-panel/ControlPanel.view';
import ControlPanelPresenter
  from '../components/control-panel/ControlPanel.presenter';

/** @class */
export default class AppPresenter extends Presenter {
  /**
   * @param {AppModel} model
   * @param {View} view
   * @param {EventEmitter} emitter
   */
  constructor(model, view, emitter) {
    super(model, view, emitter);

    this.emitter = emitter;

    this.mapView = new MapView(document.getElementById('map'), this.emitter);
    new MapPresenter(this.model, this.mapView, this.emitter);

    this.emitter.on('selectedUpdated', (selected) => {
      this.mapView.updateSelected(selected);
    });

    this.emitter.on('boundaryUpdated', (boundary) => {
      this.mapView.updateBoundary(boundary);
    });

    this.emitter.on('removeFlowLines', () => {
      this.mapView.removeFlowLines();
    });
    this.emitter.on('addFlowLines', (data) => {
      this.mapView.addFlowLines(data);
    });

    this.emitter.on('removeClusters', () => {
      this.mapView.removeClusters();
    });
    this.emitter.on('addClusters', (clusterData) => {
      this.mapView.addClusters(clusterData);
    });

    this.controlPanelView = new ControlPanelView(
        document.getElementById('control-panel'),
        this.emitter
    );
    new ControlPanelPresenter(this.model, this.controlPanelView, this.emitter);

    this.emitter.on('controlsUpdated', (controlPanel) => {
      this.controlPanelView.draw(controlPanel);
    });
  }
}
