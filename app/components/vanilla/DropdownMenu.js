import React         from 'react';
import Glyph         from './Glyph';
import { selectors } from '../../unicorns';

function LinkWrapper(props) {
  return <a href="#" className="dropdown-toggle" style={props.style} data-toggle="dropdown" >{props.children}</a>;
}

class DropdownMenu extends React.Component
{
  render() {
    const { className, id, bars, head, style={}, parentType='li' } = this.props;
    const cls = selectors(className,'dropdown');

    let link = null;

    if( bars ) {
      link = (<LinkWrapper style={style}>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
                <span className="icon-bar"></span>
            </LinkWrapper>);
    } else {
      link = (<LinkWrapper style={style}>
              {head}{" "}<Glyph icon="chevron-down" />
            </LinkWrapper>);
    }

    var E = parentType;

    return (
        <E className={cls} id={id}>
          {link}
          <ul className="dropdown-menu">
            {this.props.children}
          </ul>
        </E>
     );
  }
}

module.exports = DropdownMenu;

//