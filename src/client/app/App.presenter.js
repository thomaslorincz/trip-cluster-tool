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
   * @param {EventEmitter} emitter
   */
  constructor(model, view, emitter) {
    super(model, view);

    this.emitter = emitter;

    this.mapView = new MapView(document.getElementById('map'));
    new MapPresenter(this.model, this.mapView);

    this.emitter.on('selectedUpdated', (selected) => {
      document.dispatchEvent(new CustomEvent('selectedUpdated', {
        detail: selected,
      }));
    });

    this.emitter.on('boundaryUpdated', (boundary) => {
      document.dispatchEvent(new CustomEvent('boundaryUpdated', {
        detail: boundary,
      }));
    });

    this.emitter.on('removeFlowLines', () => {
      document.dispatchEvent(new CustomEvent('removeFlowLines'));
    });
    this.emitter.on('addFlowLines', (data) => {
      document.dispatchEvent((new CustomEvent('addFlowLines', {
        detail: data,
      })));
    });

    this.emitter.on('removeClusters', () => {
      document.dispatchEvent(new CustomEvent('removeClusters'));
    });
    this.emitter.on('addClusters', (clusterData) => {
      document.dispatchEvent(new CustomEvent('addClusters', {
        detail: clusterData,
      }));
    });

    this.controlPanelView = new ControlPanelView(
        document.getElementById('control-panel')
    );
    new ControlPanelPresenter(this.model, this.controlPanelView);

    this.emitter.on('controlsUpdated', (controlPanel) => {
      document.dispatchEvent(new CustomEvent('controlsUpdated', {
        detail: controlPanel,
      }));
    });
  }
}
