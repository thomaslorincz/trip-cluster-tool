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

    this.boundaryEntries = document.querySelectorAll('.boundary-entry');
    this.boundaryEntries.forEach((entry) => {
      entry.addEventListener('click', (event) => {
        this.container.dispatchEvent(new CustomEvent('boundaryClicked', {
          detail: event.target.dataset.value,
        }));
      });
    });

    this.modeEntries = document.querySelectorAll('.mode-entry');
    this.modeEntries.forEach((entry) => {
      entry.addEventListener('click', (event) => {
        this.container.dispatchEvent(new CustomEvent('modeClicked', {
          detail: event.target.dataset.value,
        }));
      });
    });

    this.purposeEntries = document.querySelectorAll('.purpose-entry');
    this.purposeEntries.forEach((entry) => {
      entry.addEventListener('click', (event) => {
        this.container.dispatchEvent(new CustomEvent('purposeClicked', {
          detail: event.target.dataset.value,
        }));
      });
    });
  }

  /**
   * @param {number} district
   * @param {number} iteration
   * @param {boolean} autoIterate
   * @param {number} numFlowLines
   * @param {string} boundary
   * @param {string} mode
   * @param {string} purpose
   */
  draw({district, iteration, autoIterate, numFlowLines, boundary, mode,
    purpose}) {
    if (district === -1) {
      this.selectedGeography.innerText = 'Nothing Selected';
      this.selectedGeography.classList.remove('selected-text');
    } else {
      if (boundary === 'district') {
        this.selectedGeography.innerText = `District ${district}`;
      } else {
        this.selectedGeography.innerText = `Zone ${district}`;
      }
      this.selectedGeography.classList.add('selected-text');
    }

    this.iterationNumber.innerText = iteration.toString();
    if (iteration === 0) {
      this.iterationNumber.classList.remove('selected-text');
    } else {
      this.iterationNumber.classList.add('selected-text');
    }

    if (autoIterate) {
      this.autoIterateButton.classList.add('pressed');
    } else {
      this.autoIterateButton.classList.remove('pressed');
    }

    this.numFlowLines.innerText = numFlowLines.toString();

    document.querySelectorAll('.content.selected').forEach((content) => {
      const radioButton = content.querySelector('.content-radio-button');
      radioButton.innerHTML = 'radio_button_unchecked';
      content.classList.remove('selected');
    });

    const selectedBoundary = document.getElementById(`boundary-${boundary}`);
    if (selectedBoundary) {
      selectedBoundary.querySelector('.content-radio-button').innerHTML
          = 'radio_button_checked';
      selectedBoundary.classList.add('selected');
    }

    const selectedMode = document.getElementById(`mode-${mode}`);
    if (selectedMode) {
      selectedMode.querySelector('.content-radio-button').innerHTML
          = 'radio_button_checked';
      selectedMode.classList.add('selected');
    }

    const selectedPurpose = document.getElementById(`purpose-${purpose}`);
    if (selectedPurpose) {
      selectedPurpose.querySelector('.content-radio-button').innerHTML
          = 'radio_button_checked';
      selectedPurpose.classList.add('selected');
    }
  }
}
