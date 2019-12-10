import * as React from 'react';
import './Control.css';

interface Entry {
  id: string;
  label: string;
  checked: boolean;
}

export enum SectionType {
  Radio,
  Checkbox
}

interface Section {
  id: string;
  label: string;
  type: SectionType;
  entries: Entry[];
}

interface Props {
  type: string;
  sections: Section[];
  onClick: Function;
}

export class Control extends React.Component<Props, {}> {
  public render(): React.ReactNode {
    const { sections } = this.props;

    return (
      <div className={'control' + ` ${this.props.type}-control`}>
        <div className="control-title">{this.props.type}</div>
        {sections.map((section: Section) => {
          return (
            <div className="control-section" key={section.id}>
              <div className="divider" />
              <div className="control-section-label">{section.label}</div>
              {section.entries.map((entry: Entry) => {
                return (
                  <div
                    className="control-entry"
                    key={entry.id}
                    onClick={(): void =>
                      this.props.onClick(section.id, entry.id)
                    }
                  >
                    <i className="material-icons">
                      {((): string => {
                        if (section.type === SectionType.Radio) {
                          return entry.checked
                            ? 'radio_button_checked'
                            : 'radio_button_unchecked';
                        } else {
                          return entry.checked
                            ? 'check_box'
                            : 'check_box_outline_blank';
                        }
                      })()}
                    </i>
                    {entry.label}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }
}
