import React from 'react';
import queryString from 'query-string';

export class SearchItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      anchorEl: null
    };
    this.handleTouchTap = this.handleTouchTap.bind(this);
    this.handleRequestClose = this.handleRequestClose.bind(this);
  }

  handleTouchTap(event) {
    // This prevents ghost click.
    event.preventDefault();
    this.setState({
      open: true,
      anchorEl: event.currentTarget,
    });
  }

  handleRequestClose() {
    this.setState({
      open: false,
    });
  }


  render() {
    const props = this.props;
    const data = props.data;
    const viewURI = queryString.stringify({uri: data.uri});
    const viewURL = 'pathwaycommons.org/pathways/#/view?'+viewURI;
    const editURL = viewURL+'&editkey=12345678';
    
    return (
      <div
        className='adminSearchItem'
        onClick={this.handleTouchTap}
      >
        <div className='adminNameContainer'>{data.name}</div>
        <div className='adminSubnameContainer'>
          <div className='adminDatabaseName'>{'Source: '+data.sourceInfo.name}</div>
          <div className='adminParticipantsNumber'>{'Participants: '+data.numParticipants}</div>
        </div>
        <div className='adminUrlsContainer'>
          <div className='adminUrl'>{viewURL}</div>
          <div className='adminUrl'>{editURL}</div>
        </div>
      </div>
    );
  }
}