import {
  applyMiddleware,
  combineReducers,
  createStore,
  compose,
} from 'redux/es/redux.js';

// import { createLogger } from 'redux-logger';
import { reducer as oidcReducer } from 'redux-oidc';
import { redux } from '@ohif/core';
import thunkMiddleware from 'redux-thunk';

// Combine our @ohif/core and oidc reducers
// Set init data, using values found in localStorage
const { reducers, localStorage, sessionStorage } = redux;
const middleware = [thunkMiddleware];
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;


const initialState = {
  user: null,
  isLoadingUser: false
};

const prodicomwebReducer = (state = initialState, action) => {
  switch (action.type) {
    // case USER_EXPIRED:
    //     return Object.assign({}, { ...state }, { user: null, isLoadingUser: false });
    // case SILENT_RENEW_ERROR:
    //     return Object.assign({}, { ...state }, { user: null, isLoadingUser: false });
    // case SESSION_TERMINATED:
    // case USER_SIGNED_OUT:
    //   return Object.assign({}, { ...state }, { user: null, isLoadingUser: false });
    case "prodicomweb/USER_FOUND":
      return Object.assign({}, { ...state }, { user: action.payload, isLoadingUser: false });
    case "prodicomweb/LOADING_USER":
      return Object.assign({}, {...state}, { isLoadingUser: true });
    default:
      return state;
  }
};


reducers.oidc = oidcReducer;
reducers.prodicomweb = prodicomwebReducer;

const rootReducer = combineReducers(reducers);
const preloadedState = {
  ...localStorage.loadState(),
  ...sessionStorage.loadState(),
};

const store = createStore(
  rootReducer,
  preloadedState,
  composeEnhancers(applyMiddleware(...middleware))
);

// When the store's preferences change,
// Update our cached preferences in localStorage
store.subscribe(() => {
  localStorage.saveState({
    preferences: store.getState().preferences,
  });
  sessionStorage.saveState({
    servers: store.getState().servers,
  });
});

export default store;
