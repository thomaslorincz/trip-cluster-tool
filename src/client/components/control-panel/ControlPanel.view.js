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

    this.nextIterationButton = document.getElementById('next-iteration-button');
    this.nextIterationButton.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('nextIterationClicked'));
    });

    this.autoIterateButton = document.getElementById('auto-iterate-button');
    this.autoIterateButton.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('autoIterateClicked'));
    });

    this.flowLinesDecrement = document.getElementById('flow-lines-decrement');
    this.flowLinesDecrement.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('decrementClicked'));
    });

    this.numFlowLines = document.getElementById('flow-lines');

    this.flowLinesIncrement = document.getElementById('flow-lines-increment');
    this.flowLinesIncrement.addEventListener('click', () => {
      this.container.dispatchEvent(new CustomEvent('incrementClicked'));
    });
  }

  /**
   * @param {object} settings
   * @param {number} settings.district
   * @param {number} settings.iteration
   * @param {boolean} settings.autoIterate
   * @param {number} settings.flowLines
   * @param {string} settings.dataset
   * @param {string} settings.purpose
   */
  draw(settings) {
    if (settings.district === -1) {
      this.selectedGeography.innerText = 'Nothing Selected';
      this.selectedGeography.classList.remove('blue-text');
    } else {
      this.selectedGeography.innerText = `District ${settings.district}`;
      this.selectedGeography.classList.add('blue-text');
    }

    this.iterationNumber.innerText = settings.iteration.toString();

    if (settings.autoIterate) {
      this.autoIterateButton.classList.add('pressed');
    } else {
      this.autoIterateButton.classList.remove('pressed');
    }

    this.numFlowLines.innerText = settings.flowLines.toString();
  }
}
