import React      from 'react';
import PageHeader from './vanilla/PageHeader';

import { QueryParamTracker } from '../mixins';

var SearchHeader = React.createClass({

  mixins: [ QueryParamTracker ],

  stateFromParams(queryParams) {
    return { text: queryParams.searchp };
  },

  render: function() {
    var text = this.state.text;

    return (
        <PageHeader icon="search" title={text} subTitle="Search Results" />
      );
  }  
});

module.exports = SearchHeader;

//