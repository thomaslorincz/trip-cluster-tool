/** A class that represents an origin-destination data object. */
export default class ODDatum {
  public originZone: number;
  public destZone: number;
  public originDistrict: number;
  public destDistrict: number;
  public mode: string;
  public originX: number;
  public originY: number;
  public destX: number;
  public destY: number;
  public weight: number;

  public constructor(originZone: number, destZone: number,
      originDistrict: number, destDistrict: number, mode: string,
      originX: number, originY: number, destX: number, destY: number,
      weight: number) {
    this.originZone = originZone;
    this.destZone = destZone;
    this.originDistrict = originDistrict;
    this.destDistrict = destDistrict;
    this.mode = mode;
    this.originX = originX;
    this.originY = originY;
    this.destX = destX;
    this.destY = destY;
    this.weight = weight;
  }
}
