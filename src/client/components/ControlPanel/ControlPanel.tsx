import * as React from 'react';
import './ControlPanel.css';

import { Control, SectionType } from './Control/Control';
import { FlowDirection, GeographyType, Metric } from '../App/App';

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
                  id: 'od',
                  label: 'Origin to Destination',
                  checked: flowDirection === FlowDirection.OToD
                },
                {
                  id: 'do',
                  label: 'Destination to Origin',
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
                  id: 'volume',
                  label: 'Trip Volume [trips]',
                  checked: metric === Metric.Volume
                },
                {
                  id: 'density',
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
                  id: 'district',
                  label: 'Districts',
                  checked: geographyType === GeographyType.District
                },
                {
                  id: 'zone',
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
