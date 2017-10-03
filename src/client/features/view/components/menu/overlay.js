import React from 'react';

import Button from 'material-ui/Button';
import Dialog, {DialogTitle, DialogContent, DialogActions} from 'material-ui/Dialog';
import Slide from 'material-ui/transitions/Slide';

export class Overlay extends React.Component {
  render() {
    return (
      <Dialog
        open={this.props.active}
        transition={Slide}
        onRequestClose={() => this.props.clearOverlay()}
      >
        <DialogTitle>{this.props.title}</DialogTitle>
        <DialogContent>
          {this.props.children}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => this.props.clearOverlay()}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}