import View from '../../superclasses/View';
import * as EventEmitter from 'eventemitter3';

/** A view that represents a panel with process controls and information. */
export default class ControlPanelView extends View {
  private readonly selectedGeography: HTMLElement;
  private readonly selectedLine: HTMLElement;
  private readonly flowLinesDecrement: HTMLElement;
  private readonly numFlowLines: HTMLElement;
  private readonly flowLinesIncrement: HTMLElement;
  private readonly boundaryEntries: NodeListOf<HTMLElement>;
  private readonly modeEntries: NodeListOf<HTMLElement>;

  public constructor(container: Element, emitter: EventEmitter) {
    super(container, emitter);

    this.selectedGeography = document.getElementById('selected-geography');
    this.selectedLine = document.getElementById('selected-line');

    this.flowLinesDecrement = document.getElementById('flow-lines-decrement');
    this.flowLinesDecrement.addEventListener('click', (): void => {
      this.emitter.emit('decrementClicked');
    });

    this.numFlowLines = document.getElementById('flow-lines');

    this.flowLinesIncrement = document.getElementById('flow-lines-increment');
    this.flowLinesIncrement.addEventListener('click', (): void => {
      this.emitter.emit('incrementClicked');
    });

    this.boundaryEntries = document.querySelectorAll('.boundary-entry');
    this.boundaryEntries.forEach((entry: HTMLElement): void => {
      entry.addEventListener('click', (event: Event): void => {
        if (event.target instanceof HTMLElement) {
          this.emitter.emit('boundaryClicked', event.target.dataset.value);
        }
      });
    });

    this.modeEntries = document.querySelectorAll('.mode-entry');
    this.modeEntries.forEach((entry: HTMLElement): void => {
      entry.addEventListener('click', (event: Event): void => {
        if (event.target instanceof HTMLElement) {
          this.emitter.emit('modeClicked', event.target.dataset.value);
        }
      });
    });
  }

  public draw(geography: number, lineWeight: number, numFlowLines: number,
      boundary: string, mode: string): void {
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
