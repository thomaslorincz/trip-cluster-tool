import Point from './Point';

/** A class that represents an origin-destination data object. */
export default class ODPair {
  public origin: Point;
  public destination: Point;
  public all: number;
  public auto: number;
  public transit: number;
  public active: number;

  public constructor(origin: Point, destination: Point, autoWeight: number,
      transitWeight: number, activeWeight: number) {
    this.origin = origin;
    this.destination = destination;
    this.all = autoWeight + transitWeight + activeWeight;
    this.auto = autoWeight;
    this.transit = transitWeight;
    this.active = activeWeight;
  }
}
