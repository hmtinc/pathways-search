import React from 'react';

import {DialogContentText} from 'material-ui/Dialog';
import Typography from 'material-ui/Typography';

import {PathwayCommonsService} from '../../../../services/';

// Information
// Prop Dependencies ::
// uri
export class Information extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comments: []
    };

    PathwayCommonsService.query(props.uri, 'json', 'Entity/comment')
      .then(responses => {
        this.setState({
          comments: responses ? responses.traverseEntry[0].value : []
        });
      });
  }

  render() {
    return(
      <div>
        {this.state.comments.map((comment, index) => {
          return (
            <Typography key={index} component='div'>
              {comment.replace(/<p>/g, ' ')}
              <br/>
              <br/>
            </Typography>
          );
        })}
      </div>
    );
  }
}
