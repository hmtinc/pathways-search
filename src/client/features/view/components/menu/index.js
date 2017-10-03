import React from 'react';

import {saveAs} from 'file-saver';
import {PathwayCommonsService} from '../../../../services/';
// import {Modal, Button} from 'react-bootstrap';

import AppBar from 'material-ui/AppBar';
import Button from 'material-ui/Button';
import IconButton from 'material-ui/IconButton';
import Toolbar from 'material-ui/Toolbar';
import Tooltip from 'material-ui/Tooltip';
import Typography from 'material-ui/Typography';

import {DialogContentText} from 'material-ui/Dialog';

import FileDownload from 'material-ui-icons/FileDownload';
import Help from 'material-ui-icons/Help';
import Panorama from 'material-ui-icons/Panorama';

import {HelpMenu} from './help';
import {Information} from './information';
import {Downloads} from './downloads';
import {Overlay} from './overlay.js';

export class Menu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comments: [],

    };
    PathwayCommonsService.query(this.props.uri, 'json', 'Entity/comment')
      .then(responses => {
        this.setState({
          comments: responses ? responses.traverseEntry[0].value : []
        });
      });
  }
  
  render() {
    return (
      <AppBar position='static' className='menuBar'>
        <Toolbar>
          <Typography type='title' className='menuTitle'>
            Pathway Viewer
          </Typography>
          <Tooltip
            title='See information provided by the original datasource.'
            placement='bottom'
            enterDelay={500}
            leaveDelay={300}
          >
            <Button
              className='menuInfoButton'
              onClick={() => this.props.changeOverlay('metadata')}
            >{(this.props.name ? this.props.name : this.props.uri)+' | '+(this.props.datasource)}</Button>
          </Tooltip>
          <Overlay
            active={this.props.active_overlay === 'metadata'}
            clearOverlay={() => this.props.changeOverlay('')}
            title='Pathway Information'
          >
            {this.state.comments.map((comment, index) => {
              return (
                <DialogContentText key={index}>
                  {comment.replace(/<p>/g, ' ')}
                  <br/>
                  <br/>
                </DialogContentText>
              );
            })}
          </Overlay>
          <div className='menuIcons'>
            <Tooltip
              title='Download an image (png) of the current view.'
              placement='bottom'
              enterDelay={500}
              leaveDelay={300}
            >
              <IconButton onClick={() => {
                const imgBlob = this.props.cy.png({output: 'blob', scale: 5, bg: 'white',full: true});
                saveAs(imgBlob, this.props.name  + '.png');}}>
                <Panorama />
              </IconButton>
            </Tooltip>
            <Tooltip
              title='View the different file formats available.'
              placement='bottom'
              enterDelay={500}
              leaveDelay={300}
            >
              <IconButton onClick={() => this.props.changeOverlay('downloads')}>
                <FileDownload />
              </IconButton>
            </Tooltip>
            <Overlay
              active={this.props.active_overlay === 'downloads'}
              clearOverlay={() => this.props.changeOverlay('')}
              title='Downloads'
            >
              <Downloads
                cy={this.props.cy}
                hidden={this.props.active_overlay !== 'downloads'}
                uri={this.props.uri}
                name={this.props.name}
              />
            </Overlay>
            <Tooltip
              title='Field guide to interpreting the display.'
              placement='bottom'
              enterDelay={500}
              leaveDelay={300}
            >
              <IconButton onClick={() => this.props.changeOverlay('help')}>
                <Help />
              </IconButton>
            </Tooltip>
            <Overlay
              active={this.props.active_overlay === 'help'}
              clearOverlay={() => this.props.changeOverlay('')}
              title='Help'
            >
              <HelpMenu hidden={this.props.active_overlay !== 'help'}
              />
            </Overlay>
          </div>
        </Toolbar>
      </AppBar>
    );
  }
}






// ModalFramework
// Prop Dependencies ::
// - query
// - cy
// - active
// - onHide

export class ModalFramework extends React.Component {
  render() {
    var active = this.props.active || '';
    return (
      <div className="ModalFramework">
        <Modal bsSize="large" show={Boolean(active)} onHide={() => this.props.onHide()}>
          <Modal.Body>
            <Help hidden={"Help" != active} />
            <Information hidden={'Information' != active} uri={this.props.query.uri}/>
            <Downloads cy={this.props.cy} hidden={'Downloads' != active} uri={this.props.query.uri} name={this.props.name} />
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={() => this.props.onHide()}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}
