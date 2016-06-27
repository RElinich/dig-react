import React        from 'react';
import BoundListing      from './BoundListing';
import QueryOptions from './QueryOptions';
import Tags         from './Tags';

import InlineCSS    from '../../components/vanilla/InlineCSS';
import css          from './style/browse';
import Files        from '../models/Files';

function Stems(props) {
    var store = props.store;

    return (
      <div className="stems-browser content-fluid">
        <InlineCSS css={css+Files.css} id="stems-css" />
        <div className="row stems-browser-widget">
          <div  className="col-md-3">
            <Tags store={store} />
          </div>
          <div className="col-md-6 stems-listing-widget">
            <BoundListing store={store} />   
          </div>
          <div className="col-md-2 stems-fixed-column">
            <QueryOptions store={store} />
          </div>
        </div>
      </div>
    );
}

module.exports = Stems;

