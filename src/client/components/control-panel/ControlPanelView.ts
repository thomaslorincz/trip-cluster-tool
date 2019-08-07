import View from '../../superclasses/View';
import * as EventEmitter from 'eventemitter3';

/** A view that represents a panel with process controls and information. */
export default class ControlPanelView extends View {
  private readonly flowLinesDecrement: HTMLElement;
  private readonly numFlowLines: HTMLElement;
  private readonly flowLinesIncrement: HTMLElement;
  private readonly geographyEntries: NodeListOf<HTMLElement>;
  private readonly modeEntries: NodeListOf<HTMLElement>;

  public constructor(container: Element, emitter: EventEmitter) {
    super(container, emitter);

    this.flowLinesDecrement = document.getElementById('flow-lines-decrement');
    this.flowLinesDecrement.addEventListener('click', (): void => {
      this.emitter.emit('decrementClicked');
    });

    this.numFlowLines = document.getElementById('flow-lines');

    this.flowLinesIncrement = document.getElementById('flow-lines-increment');
    this.flowLinesIncrement.addEventListener('click', (): void => {
      this.emitter.emit('incrementClicked');
    });

    this.geographyEntries = document.querySelectorAll('.geography-entry');
    this.geographyEntries.forEach((entry: HTMLElement): void => {
      entry.addEventListener('click', (event: Event): void => {
        if (event.target instanceof HTMLElement) {
          this.emitter.emit('geographyClicked', event.target.dataset.value);
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

  public draw(numFlowLines: number, geographyType: string, mode: string): void {
    this.numFlowLines.innerText = numFlowLines.toString();

    const selectedGeography = this.container
        .querySelector('.geography-entry.selected');
    if (selectedGeography) {
      selectedGeography.classList.remove('selected');
    }
    document.getElementById(`${geographyType}-entry`).classList.add('selected');

    const selectedMode = this.container
        .querySelector('.mode-entry.selected');
    if (selectedMode) {
      selectedMode.classList.remove('selected');
    }
    document.getElementById(`${mode}-entry`).classList.add('selected');
  }
}
