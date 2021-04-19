import Protocol from '../classes/Protocol';
import ViewportStructure from '../classes/ViewportStructure';
import Viewport from '../classes/Viewport';
import Stage from '../classes/Stage';
import {
  ImageMatchingRule,
  SeriesMatchingRule,
} from '../classes';

function getDefaultProtocol() {
  const protocol = new Protocol('Default');
  protocol.id = 'defaultProtocol';
  protocol.locked = true;

  const oneByOne = new ViewportStructure('grid', {
    Rows: 1,
    Columns: 1,
  });

  const viewport = new Viewport();
  const first = new Stage(oneByOne, 'oneByOne');
  first.viewports.push(viewport);

  protocol.stages.push(first);

  return protocol;
}

function getProstateProtocol() {
  var proto = new Protocol('MR_prostate');
  proto.id = 'MR_prostate';
  proto.locked = true;


  var oneByTwo = new ViewportStructure('grid', {
    Rows: 1,
    Columns: 2,
  });

  // Stage 1
  var left = new Viewport();
  var right = new Viewport();

  var firstSeries = new SeriesMatchingRule('SeriesDescription', {
    contains: {
      value: "t2_tse_tra",
    },
  });

  var secondSeries = new SeriesMatchingRule('SeriesDescription', {
    contains: {
      value: "TRACEW_DFC",
    },
  });

  var thirdImage = new ImageMatchingRule('InstanceNumber', {
    equals: {
      value: 10,
    },
  });

  left.seriesMatchingRules.push(firstSeries);
  left.imageMatchingRules.push(thirdImage);

  right.seriesMatchingRules.push(secondSeries);
  right.imageMatchingRules.push(thirdImage);

  var first = new Stage(oneByTwo, 'oneByTwo');
  first.viewports.push(left);
  first.viewports.push(right);

  proto.stages.push(first);

  return proto;
}

const defaultProtocol = getProstateProtocol();

export default defaultProtocol;
