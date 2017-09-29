import React from 'react';
import ReactDOM from 'react-dom';

import {App} from './App';
import {PathwayCommonsService} from './services/';
import RegisterCyExtensions from './cytoscape-extensions';
import injectTapEventPlugin from 'react-tap-event-plugin';

/* eslint-disable */
// styles need to be imported even though they may not be used in this file
import styles from '!style-loader!css-loader!postcss-loader!../styles/index.css';
/* eslint-enable */

// Material-ui, fixes onTouchTap events
injectTapEventPlugin({
  shouldRejectClick: function (lastTouchEventTimestamp, clickEventTimestamp) {
    return true;
  }
});

// Set user in pathway-commons
PathwayCommonsService.registerUser('pathways-search');
RegisterCyExtensions();

const mountElement = document.getElementById('container');

ReactDOM.render(<App/>, mountElement);