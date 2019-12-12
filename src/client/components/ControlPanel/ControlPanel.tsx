import * as React from 'react';
import './ControlPanel.css';

import { Control, SectionType } from './Control/Control';

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
  modes: Map<string, boolean>;
  purposes: Map<string, boolean>;
  onEntryClicked: Function;
}

export class ControlPanel extends React.Component<Props, {}> {
  public render(): React.ReactNode {
    const {
      flowDirection,
      metric,
      geographyType,
      modes,
      purposes
    } = this.props;

    return (
      <div className="control-panel">
        <Control
          type="data"
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
            this.props.onEntryClicked('data', section, entry);
          }}
        />
        <Control
          type="filter"
          sections={[
            {
              id: 'mode',
              label: 'Transportation Mode',
              type: SectionType.Checkbox,
              entries: [
                { id: 'auto', label: 'Auto', checked: modes.get('auto') },
                {
                  id: 'transit',
                  label: 'Transit',
                  checked: modes.get('transit')
                },
                { id: 'active', label: 'Active', checked: modes.get('active') }
              ]
            },
            {
              id: 'purpose',
              label: 'Trip Purpose',
              type: SectionType.Checkbox,
              entries: [
                { id: 'home', label: 'Home', checked: purposes.get('home') },
                { id: 'work', label: 'Work', checked: purposes.get('work') },
                {
                  id: 'school',
                  label: 'School',
                  checked: purposes.get('school')
                },
                { id: 'shop', label: 'Shop', checked: purposes.get('shop') },
                { id: 'eat', label: 'Eat', checked: purposes.get('eat') },
                {
                  id: 'other',
                  label: 'Other',
                  checked: purposes.get('other')
                }
              ]
            }
          ]}
          onClick={(section: string, entry: string): void => {
            this.props.onEntryClicked('filter', section, entry);
          }}
        />
      </div>
    );
  }
}
