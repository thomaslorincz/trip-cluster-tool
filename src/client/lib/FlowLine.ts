/**
 * A class that represents a flow line. A flow line shows a trend in
 * transportation from a centroid of a cluster of origins to a centroid of a
 * cluster of destinations.
 */
export default class FlowLine {
  public readonly key: string;
  public readonly originX: number;
  public readonly originY: number;
  public readonly destX: number;
  public readonly destY: number;
  public readonly weight: number;

  public constructor(key: string, originX: number, originY: number,
      destX: number, destY: number, weight: number) {
    this.key = key;
    this.originX = originX;
    this.originY = originY;
    this.destX = destX;
    this.destY = destY;
    this.weight = weight;
  }
}
