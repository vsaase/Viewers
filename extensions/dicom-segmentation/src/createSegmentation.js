import dcmjs from 'dcmjs';

function createSegmentationMetadata(segIndex, label) {
  return {
    RecommendedDisplayCIELabValue: dcmjs.data.Colors.rgb2DICOMLAB([
      1,
      0,
      0
    ]),
    SegmentedPropertyCategoryCodeSequence: {
      CodeValue: "T-D0050",
      CodingSchemeDesignator: "SRT",
      CodeMeaning: "Tissue"
    },
    SegmentNumber: segIndex,
    SegmentLabel: label,
    SegmentAlgorithmType: "MANUAL",
    //SegmentAlgorithmName: "Slicer Prototype",
    SegmentedPropertyTypeCodeSequence: {
      CodeValue: "T-D0050",
      CodingSchemeDesignator: "SRT",
      CodeMeaning: "Tissue"
    }
  }
}

export { createSegmentationMetadata };
