import React from 'react';
import TextField from 'material-ui/TextField';
import {SearchItem} from './search-item.js';

import {PathwayCommonsService} from '../../services/';

export class Admin extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      searchResult: '',
      error: ''
    };
  }

  handleInputKeyUp(e) {
    // Sample URI
    // http%3A%2F%2Fidentifiers.org%2Freactome%2FR-HSA-70171
    this.setState({
      value: e.target.value
    });
    if (e.key === 'Enter') {
      // console.log(e.target.value);
      PathwayCommonsService.querySearch({
        q: e.target.value,
        lt: 250,
        gt: 3,
        type: 'Pathway'
      })
        .then(searchResult => {
          if (!searchResult.searchHit) {
            this.setState({
              error: 'Error retrieving data'
            });
          } else {
            var searchData = searchResult.searchHit.map(result => {
              return result;
            });
            this.setState({
              searchResult: searchData
            });
          }
        });
      // fetch('http://www.pathwaycommons.org/pc2/get?uri='+this.state.value+'&format=sif')
      //   .then(function(response) {
      //     if (response.status !== 200) {
      //       console.log('Error number '+response.status+'. That looks like '+response.statusText);
      //       return;
      //     }
      //     response.text().then(function(data) {
      //       document.getElementsByClassName('adminResultDisplay')[0].innerHTML = data;
      //     });
      //   })
      //   .catch(function(error) {
      //     console.log('Request failed. '+error);
      //   });
    }
  }

  render() {
    var searchDisplay;
    if (this.state.error) {
      searchDisplay = () => {return <div className='adminErrorDiv'>{this.state.error}</div>;};
    } else if (typeof this.state.searchResult === typeof '') {
      searchDisplay = '';
    } else {
      searchDisplay = this.state.searchResult.map((item, index) => {
        return <SearchItem key={index} data={item} />;
      });
    }

    return (
      <div className='adminContainer'>
        <div className='adminFieldsContainer'>
          <TextField
            floatingLabelText='Enter a Search or a Pathway Commons URI'
            hintText={'e.g. \'Glycolysis\', \'TP53\', etc.'}
            fullWidth={true}
            onKeyUp={(e) => this.handleInputKeyUp(e)}
          />
        </div>
        <div className='adminResultDisplay'>{searchDisplay}</div>
      </div>
    );
  }
}