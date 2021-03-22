import { connect } from 'react-redux';

import SegmentationPanel from './SegmentationPanel.js';

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

const ConnectedSegmentationPanel = connect(
  mapStateToProps,
  null
)(SegmentationPanel);

export default ConnectedSegmentationPanel;
