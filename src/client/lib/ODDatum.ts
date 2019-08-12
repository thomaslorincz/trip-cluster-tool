/** A class that represents an origin-destination data object. */
export default class ODDatum {
  public originZone: number;
  public destZone: number;
  public originDistrict: number;
  public destDistrict: number;
  public originX: number;
  public originY: number;
  public destX: number;
  public destY: number;
  public auto: number;
  public transit: number;
  public active: number;

  public constructor(originZone: number, destZone: number,
      originDistrict: number, destDistrict: number, originX: number,
      originY: number, destX: number, destY: number, autoWeight: number,
      transitWeight: number, activeWeight: number) {
    this.originZone = originZone;
    this.destZone = destZone;
    this.originDistrict = originDistrict;
    this.destDistrict = destDistrict;
    this.originX = originX;
    this.originY = originY;
    this.destX = destX;
    this.destY = destY;
    this.auto = autoWeight;
    this.transit = transitWeight;
    this.active = activeWeight;
  }
}
