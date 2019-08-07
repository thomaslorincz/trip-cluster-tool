import View from '../../superclasses/View';
import * as EventEmitter from 'eventemitter3';

export default class SelectionView extends View {
  private readonly selectedGeography: HTMLElement;
  private readonly geographyWeight: HTMLElement;
  private readonly selectedLine: HTMLElement;
  private readonly lineWeight: HTMLElement;

  public constructor(container: Element, emitter: EventEmitter) {
    super(container, emitter);

    this.selectedGeography = document.getElementById('selected-geography');
    this.geographyWeight = document.getElementById('geography-weight');

    this.selectedLine = document.getElementById('selected-line');
    this.lineWeight = document.getElementById('line-weight');
  }

  public draw(geographyType: string, geographyId: number,
      geographyWeight: number, lineId: number, lineWeight: number): void {
    if (geographyId === -1) {
      this.selectedGeography.innerText = 'No geography selected';
      this.geographyWeight.classList.add('inactive');
      if (geographyType === 'district') {
        this.geographyWeight.innerText = 'District trips: N/A';
      } else {
        this.geographyWeight.innerText = 'Zone trips: N/A';
      }
    } else {
      this.geographyWeight.classList.remove('inactive');

      if (geographyType === 'district') {
        this.selectedGeography.innerText = `District ${geographyId}`;
        this.geographyWeight.innerText
            = `District trips: ${geographyWeight} / 5,136,299`;
      } else {
        this.selectedGeography.innerText = `Zone ${geographyId}`;
        this.geographyWeight.innerText
            = `Zone trips: ${geographyWeight} / 5,136,299`;
      }
    }

    if (lineWeight === -1) {
      this.selectedLine.innerText = 'No flow line selected';
      this.lineWeight.classList.add('inactive');
      this.lineWeight.innerText = 'Line trips: N/A';
    } else {
      this.selectedLine.innerText = `Line ${lineId}`;
      this.lineWeight.classList.remove('inactive');
      this.lineWeight.innerText
          = `Line trips: ${lineWeight} / ${geographyWeight}`;
    }
  }
}
