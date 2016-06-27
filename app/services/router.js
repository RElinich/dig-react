import RouteRecognizer  from 'route-recognizer';
import rsvp             from 'rsvp';
import querystring      from 'querystring';

import Eventer          from './eventer';
import env              from './env';
import events           from '../models/events';

class Router extends Eventer
{
  constructor() {
    super(...arguments);

    this.recognizer = new RouteRecognizer();

    this.routes = null;
    this.rewrites = [];
    this.__currRoute = {};

    (typeof window !== 'undefined') && (window.onpopstate = this.updateURL.bind(this));
  }
  
  get _currentRoute() {
    return this.__currRoute;
  }

  addRoutes(routes, rewrites) {

    this.routes = routes;
    this.rewrites = rewrites || [];
    // baby steps: nothing nested for now

    if( !('error' in this.routes) ) {
      this.routes.error = require('../routes/error');
    }

    for( var handler in routes ) {
      var component = routes[handler];
      if( !component.path ) {
        component.path = '/' + handler;
      }
      if( !component.store ) {
        component.store = function() { return rsvp.resolve({}); };
      }
      var paths = Array.isArray( component.path ) ? component.path : [ component.path ];
      paths.forEach( path => this.recognizer.add( [ { path, handler } ] ) );
    }
  }
  
  runRewrites(url) {
    if( url ) {
      for( var i = 0; i < this.rewrites.length; i++) {
        var rule = this.rewrites[i];
        if( url.match(rule.regex) !== null ) {
          return url.replace(rule.regex,rule.now);
        }
      }
    }
    return url;
  }

  resolve(url) {
    this._ensureRoutes();
    url = this.runRewrites(url);
    var results = this.recognizer.recognize(url);
    if( results ) {
      var handlers = results.slice();
      var queryParams = results.queryParams || {};
      var routes = this.routes;
      return handlers.map( function(h) { 
                                return { 
                                  component: routes[h.handler], 
                                  params: h.params || {},
                                  queryParams 
                                };
                              });
    }
    return null;
  }

  /* in browser methods */
  navigateTo(url,stateObj) {
    try {
      url = this.runRewrites(url);
      this.setBrowserAddressBar(url,stateObj);
      this.updateURL();
    } 
    catch(e) {
      env.error(e);
    }
  }

  setBrowserAddressBar(url,stateObj) {
    url = this.runRewrites(url);
    if( url ) {
      window.history.pushState(stateObj || null,null,url);
      if( window.ga ) {
        window.ga( 'send', 'pageview', document.location.pathname );
      }
    }
  }

  updateURL() {
    var q = document.location.search || '';
    var pathname = document.location.pathname + q;
    var handlers = this.resolve(pathname);
    if (!handlers ) {
      // ummmmm
      return window.alert('Not Found');
    }
    if( handlers.length > 1 ) {
      throw new Error('wups - don\'t do nested route handlers yet');
    }
    var handler = handlers[0];

    if( this.__currRoute.component &&
        !this.__currRoute.component.noReuse &&
        document.location.pathname === this.__currRoute.component.path &&
        this.__currRoute.store.refreshModel ) {

          var store = this.__currRoute.store;
          this.ignoreEvents = true;
          if( q ) {
            var qp = querystring.parse(q.substr(1));
            store.applyURIQuery(qp).finally( this._postInRouteNavigate.bind(this) );
          } else {
            store.applyURIDefault().finally( this._postInRouteNavigate.bind(this) );
          }

    } else {

      handler.component.store(handler.params, handler.queryParams)
        .then( store => {
    
            var meta = {
              store,              
              name:        handler.component.displayName, 
              component:   handler.component,
              path:        handler.component.path,
              params:      handler.params,
              queryParams: handler.queryParams,
              hash:        document.location.hash || ''
            };
            
            this.emit( events.PRE_NAVIGATE, meta, this.__currRoute );

            var prevStore = this.__currRoute.store;
            if( prevStore && prevStore.removeListener ) {
              prevStore.removeListener( events.PARAMS_CHANGED, this.paramChanged.bind(this) );
            }
            this.__currRoute = {
              component: handler.component,
              store
            };
            if( store.on ) {
              store.on( events.PARAMS_CHANGED, this.paramChanged.bind(this) );
            }
            this.emit( events.NAVIGATE_TO, {
              store,              
              name:        handler.component.displayName, 
              component:   handler.component,
              path:        handler.component.path,
              params:      handler.params,
              queryParams: handler.queryParams,
              hash:        document.location.hash || ''
            });
        }).catch( error => {
          env.error( error );
        });
    }
  }

  paramChanged(queryParams,store) {
    if( !this.ignoreEvents ) {
      var str = store.queryString;
      if( str.length === 0 ) {
        str = this.__currRoute.component.path;
      } else {
        str = '?' + str;
      }
      this.setBrowserAddressBar( str );
      this._postInRouteNavigate();
    }    
  }

  _ensureRoutes() {
    if( this.routes !== null ) {
      return;
    }
    if( env.routes ) {
      this.addRoutes( env.routes, env.rewriteRules );
    }
  }

  _postInRouteNavigate() {
    this.ignoreEvents = false;
    this.emit( events.NAVIGATE_TO_THIS );
  }

}
    
module.exports = new Router();

