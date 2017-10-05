import React from 'react';

import Paper from 'material-ui/Paper';
import Typography from 'material-ui/Typography';

export class ImageCard extends React.Component {
  render() {
    return (
      <div>
        <Paper elevation={4} className='imageCard'>
          <img src={this.props.src} alt='Image not found.' />
          <br/>
          <Typography type='caption' component='div' className='imageCardCaption'>
            {this.props.children}
          </Typography>
        </Paper>
      </div>
    );
  }
}