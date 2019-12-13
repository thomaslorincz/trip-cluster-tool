import * as React from 'react';

import { Control, SectionType } from '../Control/Control';

export enum FlowDirection {
  OToD, // Origin to Destination (Selected is Destination)
  DToO // Destination to Origin (Selected is Origin)
}

export enum Metric {
  Volume,
  Density
}

export enum GeographyType {
  District,
  Zone
}

interface Props {
  flowDirection: FlowDirection;
  metric: Metric;
  geographyType: GeographyType;
  onEntryClicked: Function;
}

export class DataControl extends React.Component<Props, {}> {
  public render(): React.ReactNode {
    const { flowDirection, metric, geographyType } = this.props;

    return (
      <Control
        type="data"
        title="Data"
        sections={[
          {
            id: 'flow',
            label: 'Flow Direction',
            type: SectionType.Radio,
            entries: [
              {
                id: FlowDirection.OToD,
                label: 'To Selected',
                checked: flowDirection === FlowDirection.OToD
              },
              {
                id: FlowDirection.DToO,
                label: 'From Selected',
                checked: flowDirection === FlowDirection.DToO
              }
            ]
          },
          {
            id: 'metric',
            label: 'Data Metric',
            type: SectionType.Radio,
            entries: [
              {
                id: Metric.Volume,
                label: 'Trip Volume [trips]',
                checked: metric === Metric.Volume
              },
              {
                id: Metric.Density,
                label: 'Trip Density [trips/km²]',
                checked: metric === Metric.Density
              }
            ]
          },
          {
            id: 'geography',
            label: 'Geography Type',
            type: SectionType.Radio,
            entries: [
              {
                id: GeographyType.District,
                label: 'Districts',
                checked: geographyType === GeographyType.District
              },
              {
                id: GeographyType.Zone,
                label: 'Zones',
                checked: geographyType === GeographyType.Zone
              }
            ]
          }
        ]}
        onClick={(section: string, entry: string): void => {
          this.props.onEntryClicked(section, entry);
        }}
      />
    );
  }
}
