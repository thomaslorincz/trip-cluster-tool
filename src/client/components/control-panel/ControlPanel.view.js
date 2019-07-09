import View from '../../superclasses/View';

/** A view that represents a panel with process controls and information. */
export default class ControlPanelView extends View {
  /**
   * @param {HTMLElement} container
   * @param {EventEmitter} emitter
   */
  constructor(container, emitter) {
    super(container, emitter);

    this.selectedGeography = document.getElementById('selected-geography');
    this.selectedLine = document.getElementById('selected-line');

    this.iterationNumber = document.getElementById('iteration-number');

    this.nextIterationButton = document.getElementById('next-iteration-button');
    this.nextIterationButton.addEventListener('click', () => {
      this.emitter.emit('nextIterationClicked');
    });

    this.autoIterateButton = document.getElementById('auto-iterate-button');
    this.autoIterateButton.addEventListener('click', () => {
      this.emitter.emit('autoIterateClicked');
    });

    this.flowLinesDecrement = document.getElementById('flow-lines-decrement');
    this.flowLinesDecrement.addEventListener('click', () => {
      this.emitter.emit('decrementClicked');
    });

    this.numFlowLines = document.getElementById('flow-lines');

    this.flowLinesIncrement = document.getElementById('flow-lines-increment');
    this.flowLinesIncrement.addEventListener('click', () => {
      this.emitter.emit('incrementClicked');
    });

    this.boundaryEntries = document.querySelectorAll('.boundary-entry');
    this.boundaryEntries.forEach((entry) => {
      entry.addEventListener('click', (event) => {
        this.emitter.emit('boundaryClicked', event.target.dataset.value);
      });
    });

    this.modeEntries = document.querySelectorAll('.mode-entry');
    this.modeEntries.forEach((entry) => {
      entry.addEventListener('click', (event) => {
        this.emitter.emit('modeClicked', event.target.dataset.value);
      });
    });
  }

  /**
   * @param {number} geography
   * @param {number} lineWeight
   * @param {number} iteration
   * @param {boolean} autoIterate
   * @param {number} numFlowLines
   * @param {string} boundary
   * @param {string} mode
   */
  draw({geography, lineWeight, iteration, autoIterate, numFlowLines, boundary,
    mode}) {
    if (geography === -1) {
      this.selectedGeography.innerText = 'Nothing Selected';
      this.selectedGeography.classList.remove('selected-text');
    } else {
      if (boundary === 'district') {
        this.selectedGeography.innerText = `District ${geography}`;
      } else {
        this.selectedGeography.innerText = `Zone ${geography}`;
      }
      this.selectedGeography.classList.add('selected-text');
    }

    if (lineWeight === -1) {
      this.selectedLine.innerText = '';
    } else {
      this.selectedLine.innerText = `Line Trips: ${lineWeight}`;
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
  }
}
