import React from 'react';

import Snackbar from 'material-ui/Snackbar';

import queryString from 'query-string';

import {Graph, Menu} from './components/';

import make_cytoscape from './cy/';

import {ErrorMessage} from '../common-components/';
import {PathwayCommonsService} from '../../services/';

// View
// Prop Dependencies ::
// - query
// - history
// - logPageView
// - logEvent

export class View extends React.Component {
  constructor(props) {
    super(props);
    const query = queryString.parse(props.location.search);
    this.state = {
      query: query,
      cy: make_cytoscape({ headless: true }), // cytoscape mounted after Graph component has mounted
      sbgnText: {}, // outdated. graphJSON is used now. Any function using this field needs to be changed
      graphJSON: {},
      name: '',
      datasource: '',
      snackbar: {
        snackbarOpen: false,
        snackbarMsg: '',
        snackbarDur: 4000
      },
      active_overlay: ''
    };

    PathwayCommonsService.query(query.uri, 'SBGN')
      .then(responseText => {
        this.setState({
          sbgnText: responseText
        });
      });

    PathwayCommonsService.query(query.uri, 'json', 'Named/displayName')
      .then(responseObj => {
        this.setState({
          name: responseObj ? responseObj.traverseEntry[0].value.pop() : ''
        });
      });

    PathwayCommonsService.query(query.uri, 'json', 'Entity/dataSource/displayName')
      .then(responseObj => {
        this.setState({
          datasource: responseObj ? responseObj.traverseEntry[0].value.pop() : ''
        });
      });

    props.logPageView( props.history.location );
    props.logEvent({
      category: 'View',
      action: 'view',
      label: query.uri
    });

    this.handleSnackbarClose = this.handleSnackbarClose.bind(this);
  }

  componentWillReceiveProps( nextProps ) {
    const locationChanged = nextProps.location !== this.props.location;
    if( locationChanged ){
      this.props.logEvent({
        category: 'View',
        action: 'view',
        label: this.state.query.uri
      });
    }
  }
  
  componentWillMount() {
    const editkey = this.state.query.editkey;
    if (editkey != null) {
      // CHECK FOR VALID EDIT KEY HERE
      if (editkey === '12345678') {
        this.setState({
          snackbar: {
            snackbarOpen: true,
            snackbarMsg: 'You are in edit mode. Be careful! Your changes are live.',
            snackbarDur: this.state.snackbar.snackbarDur
          }
        });
      } else {
        this.setState({
          snackbar: {
            snackbarOpen: true,
            snackbarMsg: 'Nice try, imposter.',
            snackbarDur: this.state.snackbar.snackbarDur
          }
        });
      }
    }
  }

  handleSnackbarClose() {
    this.setState({
      snackbar: {
        snackbarOpen: false,
        snackbarMsg: this.state.snackbar.snackbarMsg,
        snackbarDur: this.state.snackbar.snackbarDur
      }
    });
  }

  handleOverlayToggle(overlay) {
    this.setState({
      active_overlay: overlay
    });
  }

  render() {
    if(this.state.sbgnText) {
      return(
        <div className="View">
          { !this.props.embed &&
            (<Menu
              name={this.state.name}
              uri={this.state.query.uri}
              datasource={this.state.datasource}
              active_overlay={this.state.active_overlay}
              cy={this.state.cy}
              changeOverlay={(overlay) => this.handleOverlayToggle(overlay)}  
            />)
          }
          <Graph cy={this.state.cy} sbgnText={this.state.sbgnText}/>
          <Snackbar
            open={this.state.snackbar.snackbarOpen}
            message={this.state.snackbar.snackbarMsg}
            autoHideDuration={this.state.snackbar.snackbarDur}
            onRequestClose={() => this.handleSnackbarClose()}
          />
        </div>
      );
    }
    else  {
      return (
        <ErrorMessage className="View">
          Invalid URI
        </ErrorMessage>
      );
    }
  }
}
