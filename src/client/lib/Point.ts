/** A class that represents an origin or destination point. */
export default class Point {
  public zone: number;
  public district: number;
  public x: number;
  public y: number;
  public weight: number;

  public constructor(zone: number, district: number, x: number, y: number,
      weight: number) {
    this.zone = zone;
    this.district = district;
    this.x = x;
    this.y = y;
    this.weight = weight;
  }
}
