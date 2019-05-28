import View from '../../superclasses/View';

/**
 * A view that represents a panel with process controls and information.
 */
export default class ControlPanelView extends View {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    super(container);

    this.selectedGeography = document.getElementById('selected-geography');

    this.iterationNumber = document.getElementById('iteration-number');

    this.nextIterationButton = document.getElementById('next-iteration');
    this.nextIterationButton.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('nextIterationClicked'));
    });

    this.autoIterateSwitch = document.getElementById('auto-iterate-switch');
    this.autoIterateSwitch.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('autoIterateClicked'));
    });

    this.clusterNumber = document.getElementById('cluster-number');

    this.clusterSlider = document.getElementById('cluster-slider');
    this.clusterSlider.addEventListener('input', (event) => {
      this.container.dispatchEvent(new CustomEvent('clusterInput', {
        detail: event.target.valueAsNumber,
      }));
    });

    this.runAgainButton = document.getElementById('run-again-button');
    this.runAgainButton.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('runAgainClicked'));
    });

    this.datasetRadioButtons = document.getElementsByName('dataset');
    this.datasetRadioButtons.forEach((radioButton) => {
      radioButton.addEventListener('change', (event) => {
        this.container.dispatchEvent(new CustomEvent('datasetClicked', {
          detail: event.target.value,
        }));
      });
    });

    this.purposeRadioButtons = document.getElementsByName('purpose');
    this.purposeRadioButtons.forEach((radioButton) => {
      radioButton.addEventListener('change', (event) => {
        this.container.dispatchEvent(new CustomEvent('purposeClicked', {
          detail: event.target.value,
        }));
      });
    });
  }

  /**
   * @param {object} settings
   * @param {string} settings.district
   * @param {number} settings.iteration
   * @param {boolean} settings.autoIterate
   * @param {number} settings.clusters
   * @param {string} settings.dataset
   * @param {string} settings.purpose
   */
  draw(settings) {
    if (settings.district === '') {
      this.selectedGeography.innerText = 'Nothing Selected';
    } else {
      this.selectedGeography.innerText = `District ${settings.district}`;
    }

    this.iterationNumber.innerText = settings.iteration.toString();

    if (settings.autoIterate) {
      this.autoIterateSwitch.classList.add('enabled');
    } else {
      this.autoIterateSwitch.classList.remove('enabled');
    }

    this.clusterNumber.innerText = settings.clusters.toString();
  }
}
