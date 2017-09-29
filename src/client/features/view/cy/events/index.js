import bindHover from './hover';
import bindExpandCollapse from './expandCollapse';
import bindMove from './move';

const bindEvents = (cy) => {
  bindHover(cy);
  bindExpandCollapse(cy);
  bindMove(cy);
};

export default bindEvents;