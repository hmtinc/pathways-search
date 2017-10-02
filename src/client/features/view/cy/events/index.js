import bindHover from './hover';
import bindExpandCollapse from './expandCollapse';
import bindMove from './move';
import bindClick from './click';

const bindEvents = (cy) => {
  bindHover(cy);
  bindExpandCollapse(cy);
  bindMove(cy);
  bindClick(cy);
};

export default bindEvents;