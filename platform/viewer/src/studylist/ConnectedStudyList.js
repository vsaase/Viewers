import { connect } from 'react-redux';

import StudyListRoute from './StudyListRoute.js';

const isActive = a => a.active === true;

const mapStateToProps = state => {
  const activeServer = state.servers.servers.find(isActive);
  if(state.oidc.user) {
    return {
      server: activeServer,
      user: state.oidc.user,
    }
  } else if(!state.prodicomweb.isLoadingUser) {
    return {
      server: activeServer,
      user: state.prodicomweb.user,
    }
  }  else {
    return {
      server: activeServer,
      user: {username: ""},
    }
  }
};

const ConnectedStudyList = connect(
  mapStateToProps,
  null
)(StudyListRoute);

export default ConnectedStudyList;
