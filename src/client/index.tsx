import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as d3 from 'd3-fetch';
import './index.css';

import { App } from './components/App/App';

Promise.all([d3.json('./zones.json')]).then(([zones]) => {
  ReactDOM.render(<App zones={zones} />, document.getElementById('root'));
});
