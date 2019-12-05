import * as React from 'react';

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
    return (
      <div className={'control' + ` ${this.props.type}-control`}>
        <div className="control-title">{this.props.type}</div>
        {/* TODO: sections */}
      </div>
    );
  }
}
