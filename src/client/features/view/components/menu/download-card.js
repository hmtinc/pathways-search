import React from 'react';

import {
  ListItem,
  ListItemIcon,
} from 'material-ui/List';
import Typography from 'material-ui/Typography';

import FileDownload from 'material-ui-icons/FileDownload';

export class DownloadCard extends React.Component {
  render() {
    return (
      <ListItem button onClick={this.props.onClick}>
        <ListItemIcon>
          <FileDownload />
        </ListItemIcon>
        <div>
          <Typography type='subheading' className='menuSubheading'>{this.props.name}</Typography>
          <Typography component='div'>
            {this.props.children}
          </Typography>
        </div>
      </ListItem>
    );
  }
}