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
  times: Map<string, boolean>;
  onEntryClicked: Function;
}

export class ControlPanel extends React.Component<Props, {}> {
  public render(): React.ReactNode {
    const {
      flowDirection,
      metric,
      geographyType,
      modes,
      purposes,
      times
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
                  label: 'Trip Volume',
                  checked: metric === Metric.Volume
                },
                {
                  id: 'density',
                  label: 'Trip Density',
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
                  id: 'escort',
                  label: 'Escort',
                  checked: purposes.get('escort')
                },
                {
                  id: 'personal',
                  label: 'Personal Business',
                  checked: purposes.get('personal')
                },
                {
                  id: 'quick',
                  label: 'Quick Stop',
                  checked: purposes.get('quick')
                },
                {
                  id: 'social',
                  label: 'Social',
                  checked: purposes.get('social')
                },
                {
                  id: 'recreation',
                  label: 'Recreation',
                  checked: purposes.get('recreation')
                }
              ]
            },
            {
              id: 'time',
              label: 'Time of Day',
              type: SectionType.Checkbox,
              entries: [
                {
                  id: 'early',
                  label: 'Early Morning (04:00-06:00)',
                  checked: times.get('early')
                },
                {
                  id: 'amShoulder1',
                  label: 'AM Shoulder 1 (06:00-07:00)',
                  checked: times.get('amShoulder1')
                },
                {
                  id: 'amCrown',
                  label: 'AM Crown (07:00-08:00)',
                  checked: times.get('amCrown')
                },
                {
                  id: 'amShoulder2',
                  label: 'AM Shoulder 2 (08:00-09:00)',
                  checked: times.get('amShoulder2')
                },
                {
                  id: 'midday',
                  label: 'Midday (09:00-15:30)',
                  checked: times.get('midday')
                },
                {
                  id: 'pmShoulder1',
                  label: 'PM Shoulder 1 (15:30-16:30)',
                  checked: times.get('pmShoulder1')
                },
                {
                  id: 'pmCrown',
                  label: 'PM Crown (16:30-17:30)',
                  checked: times.get('pmCrown')
                },
                {
                  id: 'pmShoulder2',
                  label: 'PM Shoulder 2 (17:30-18:30)',
                  checked: times.get('pmShoulder2')
                },
                {
                  id: 'evening',
                  label: 'Evening (18:30-22:00)',
                  checked: times.get('evening')
                },
                {
                  id: 'overnight',
                  label: 'Overnight (22:00-04:00)',
                  checked: times.get('overnight')
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
