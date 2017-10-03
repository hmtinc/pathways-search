import React from 'react';
import isEmpty from 'lodash.isempty';

import List, { ListItem, ListItemText } from 'material-ui/List';
import Menu, { MenuItem } from 'material-ui/Menu';

import convertSbgn from 'sbgnml-to-cytoscape';

import { defaultLayout, getDefaultLayout, layoutNames, layoutMap } from './layout/';
import { Spinner, ErrorMessage } from '../../../common-components';

import * as toolTipCreator from './createToolTips.js' ;

// Graph
// Prop Dependencies ::
// - sbgnText
// - cytoscape
export class Graph extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      graphId: Math.floor(Math.random() * Math.pow(10, 8)) + 1,
      graphRendered: false,
      graphEmpty: false,
      width: '100vw',
      height: '85vh',
      layout: defaultLayout,
      layoutMenuOpen: false,
      layoutMenuAnchorEl: null,
      availableLayouts: []
    };
  }

  componentWillUpdate(nextProps, nextState) {
    if (nextState.layout !== this.state.layout && this.state.graphRendered) {
      this.performLayout(nextState.layout, this.props.cy);
    }
  }

  componentWillUnmount() {
    this.props.cy.destroy();
  }

  componentDidMount() {
    const container = document.getElementById(this.state.graphId);
    this.props.cy.mount(container);
  }

  shouldComponentUpdate(nextProps, nextState) {
    this.checkRenderGraph(nextProps.sbgnText);
    return true;
  }

  checkRenderGraph(data) {
    if (!isEmpty(data) && (!this.state.graphRendered)) {
      this.renderGraph(data);
    }
  }


  // Graph rendering is not tracked by React
  renderGraph(sbgnText) {
    const graphJSON = convertSbgn(sbgnText);
    const cy = this.props.cy;

    cy.remove('*');
    cy.add(graphJSON);

    toolTipCreator.bindTippyToElements(cy);

    const layout = getDefaultLayout(cy.nodes().size());

    this.performLayout(layout, graphJSON);

    this.state.layout = layout;

    this.state.availableLayouts = layoutNames(cy.nodes().size());
    this.state.graphRendered = true;
  }

  performLayout(layoutName) {
    const cy = this.props.cy;
    cy.nodes('[class="complex"], [class="complex multimer"]').filter(node => node.isExpanded()).collapse();
    cy.layout(layoutMap.get(layoutName)).run();
  }

  render() {
    const layoutDropdownItems = this.state.availableLayouts.map((layoutName) =>
      <MenuItem key={layoutName} onClick={() => this.setState({layout: layoutName, layoutMenuOpen: false})}>
        {layoutName}
      </MenuItem>
    );

    if (!this.state.graphEmpty) {
      return (
        <div className='Graph'>
          <List className='layoutMenu'>
            <ListItem
              button
              aria-haspopup='true'
              aria-controls='lock-menu'
              aria-label={`Layout | ${this.state.layout}`}
              onClick={(e) => this.setState({layoutMenuOpen: true, layoutMenuAnchorEl: e.currentTarget})}
            >
              <ListItemText
                primary={`Layout | ${this.state.layout}`}
              />
            </ListItem>
          </List>
          <Menu
            anchorEl={this.state.layoutMenuAnchorEl}
            open={this.state.layoutMenuOpen}
            onRequestClose={() => this.setState({layoutMenuOpen: false})}
          >
            {layoutDropdownItems}
          </Menu>
          <div className="SpinnerContainer">
            <Spinner hidden={this.state.graphRendered} />
          </div>
          <div id={this.state.graphId} style={{
            width: this.state.width,
            height: this.state.height
          }} />
        </div>
      );
    }
    else {
      return (
        <ErrorMessage className='Graph'>
          No Paths Found
        </ErrorMessage>
      );
    }
  }
}
