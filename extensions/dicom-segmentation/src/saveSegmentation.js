import dcmjs from 'dcmjs';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';
import dicomParser from 'dicom-parser';

import { api } from 'dicomweb-client';

import OHIF from '@ohif/core';
import { DICOMWeb, errorHandler } from '@ohif/core';
const { studyMetadataManager, DicomLoaderService } = OHIF.utils;
const { DicomMetaDictionary, DicomMessage, DicomDict } = dcmjs.data;

//const { Normalizer } = dcmjs.normalizers;
import { Normalizer } from './normalizers'

const { Segmentation } = dcmjs.derivations;
const SegmentationDerivation = Segmentation;
import { encode, decode} from 'dcmjs';

export default async function saveSegmentation(element, labelmaps3D) {

  const stackToolState = cornerstoneTools.getToolState(element, "stack");
  const imageIds = stackToolState.data[0].imageIds;

  let images = []
  for (let i = 0; i < imageIds.length; i++) {
    images.push(cornerstone.metaData.get("instance",imageIds[i]));
  }
  console.log(images);
  const dataset = generateSegmentation(
    images,
    labelmaps3D
  );
  const part10Buffer = datasetToDict(dataset).write()
  const { baseurl } = parseImageId(imageIds[0]);
  await stowDICOM(baseurl, part10Buffer);

}

async function stowDICOM(url, part10Buffer) {
  const config = {
    url,
    headers: DICOMWeb.getAuthorizationHeader(),
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };
  const dicomWeb = new api.DICOMwebClient(config);
  const options = {
    datasets: [part10Buffer],
  };

  await dicomWeb.storeInstances(options);
}


function parseImageId(imageId) {
  // wadors:http://localhost:8088/rs/studies/1.226/series/1.2.840.113654.2.70.1.17715843509433798103115064114496921292/instances/1.2.840.113654.2.70.1.92291956188888683087932898250107545898/frames/1
  // build a url by parsing out the url scheme and frame index from the imageId
  const firstColonIndex = imageId.indexOf(':');

  let url = imageId.substring(firstColonIndex + 1);
  const frameIndex = url.indexOf('/frames/');

  let frame;

  if (frameIndex !== -1) {
    const frameStr = url.substr(frameIndex + 8);

    frame = parseInt(frameStr, 10);
    url = url.substr(0, frameIndex);
  }
  const studiesIndex = url.indexOf('/studies');
  const seriesIndex = url.indexOf('/series');
  const instancesIndex = url.indexOf('/instances');
  const baseurl = url.substr(0, studiesIndex);
  const studyInstanceUID = url.substr(studiesIndex + 9, seriesIndex - (studiesIndex + 9));
  const seriesInstanceUID = url.substr(seriesIndex + 8, instancesIndex - (seriesIndex + 8));
  const sopInstanceUID = url.substr(instancesIndex + 11);

  return {
    scheme: imageId.substr(0, firstColonIndex),
    baseurl,
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUID,
    frame,
  };
}



// following functions copied from dcmjs, related to bug  in dcmjs https://github.com/dcmjs-org/dcmjs/issues/192


/**
 *
 * @typedef {Object} BrushData
 * @property {Object} toolState - The cornerstoneTools global toolState.
 * @property {Object[]} segments - The cornerstoneTools segment metadata that corresponds to the
 *                                 seriesInstanceUid.
 */

 const generateSegmentationDefaultOptions = {
  includeSliceSpacing: true,
  rleEncode: false
};

/**
* generateSegmentation - Generates cornerstoneTools brush data, given a stack of
* imageIds, images and the cornerstoneTools brushData.
*
* @param  {object[]} images An array of dcmjs naturalized datasets
* @param  {Object|Object[]} inputLabelmaps3D The cornerstone `Labelmap3D` object, or an array of objects.
* @param  {Object} userOptions Options to pass to the segmentation derivation and `fillSegmentation`.
* @returns {Blob}
*/
function generateSegmentation(images, inputLabelmaps3D, userOptions = {}) {
  const multiframe = Normalizer.normalizeToDataset(images);
  const segmentation = new SegmentationDerivation([multiframe], userOptions);

  const options = Object.assign(
      {},
      generateSegmentationDefaultOptions,
      userOptions
  );

  // Use another variable so we don't redefine labelmaps3D.
  const labelmaps3D = Array.isArray(inputLabelmaps3D)
      ? inputLabelmaps3D
      : [inputLabelmaps3D];

  let numberOfFrames = 0;
  const referencedFramesPerLabelmap = [];

  for (
      let labelmapIndex = 0;
      labelmapIndex < labelmaps3D.length;
      labelmapIndex++
  ) {
      const labelmap3D = labelmaps3D[labelmapIndex];
      const { labelmaps2D, metadata } = labelmap3D;

      const referencedFramesPerSegment = [];
      for (let i = 1; i < metadata.data.length; i++) {
          if (metadata.data[i]) {
              referencedFramesPerSegment[i] = [];
          }
      }

      for (let i = 0; i < labelmaps2D.length; i++) {
          const labelmap2D = labelmaps2D[i];

          if (labelmaps2D[i]) {
              const { segmentsOnLabelmap } = labelmap2D;

              segmentsOnLabelmap.forEach(segmentIndex => {
                  if (segmentIndex !== 0) {
                      referencedFramesPerSegment[segmentIndex].push(i);
                      numberOfFrames++;
                  }
              });
          }
      }

      referencedFramesPerLabelmap[labelmapIndex] = referencedFramesPerSegment;
  }

  segmentation.setNumberOfFrames(numberOfFrames);

  for (
      let labelmapIndex = 0;
      labelmapIndex < labelmaps3D.length;
      labelmapIndex++
  ) {
      const referencedFramesPerSegment =
          referencedFramesPerLabelmap[labelmapIndex];

      const labelmap3D = labelmaps3D[labelmapIndex];
      const { metadata } = labelmap3D;

      for (
          let segmentIndex = 1;
          segmentIndex < referencedFramesPerSegment.length;
          segmentIndex++
      ) {
          const referencedFrameIndicies =
              referencedFramesPerSegment[segmentIndex];

          if (referencedFrameIndicies) {
              // Frame numbers start from 1.
              const referencedFrameNumbers = referencedFrameIndicies.map(
                  element => {
                      return element + 1;
                  }
              );
              const segmentMetadata = metadata.data[segmentIndex];
              const labelmaps = _getLabelmapsFromRefernecedFrameIndicies(
                  labelmap3D,
                  referencedFrameIndicies
              );

              segmentation.addSegmentFromLabelmap(
                  segmentMetadata,
                  labelmaps,
                  segmentIndex,
                  referencedFrameNumbers
              );
          }
      }
  }

  if (options.rleEncode) {
      const rleEncodedFrames = encode(
          segmentation.dataset.PixelData,
          numberOfFrames,
          segmentation.dataset.Rows,
          segmentation.dataset.Columns
      );

      // Must use fractional now to RLE encode, as the DICOM standard only allows BitStored && BitsAllocated
      // to be 1 for BINARY. This is not ideal and there should be a better format for compression in this manner
      // added to the standard.
      segmentation.assignToDataset({
          BitsAllocated: "8",
          BitsStored: "8",
          HighBit: "7",
          SegmentationType: "FRACTIONAL",
          SegmentationFractionalType: "PROBABILITY",
          MaximumFractionalValue: "255"
      });

      segmentation.dataset._meta.TransferSyntaxUID = {
          Value: ["1.2.840.10008.1.2.5"],
          vr: "UI"
      };
      segmentation.dataset._vrMap.PixelData = "OB";
      segmentation.dataset.PixelData = rleEncodedFrames;
  } else {
      // If no rleEncoding, at least bitpack the data.
      segmentation.bitPackPixelData();
  }

  return segmentation.dataset;

}

function _getLabelmapsFromRefernecedFrameIndicies(
  labelmap3D,
  referencedFrameIndicies
) {
  const { labelmaps2D } = labelmap3D;

  const labelmaps = [];

  for (let i = 0; i < referencedFrameIndicies.length; i++) {
      const frame = referencedFrameIndicies[i];

      labelmaps.push(labelmaps2D[frame].pixelData);
  }

  return labelmaps;
}

function datasetToDict(dataset) {
  const fileMetaInformationVersionArray = new Uint8Array(2);
  fileMetaInformationVersionArray[1] = 1;

  const TransferSyntaxUID =
      dataset._meta &&
      dataset._meta.TransferSyntaxUID &&
      dataset._meta.TransferSyntaxUID.Value &&
      dataset._meta.TransferSyntaxUID.Value[0]
          ? dataset._meta.TransferSyntaxUID.Value[0]
          : "1.2.840.10008.1.2.1";

  dataset._meta = {
      MediaStorageSOPClassUID: dataset.SOPClassUID,
      MediaStorageSOPInstanceUID: dataset.SOPInstanceUID,
      ImplementationVersionName: "dcmjs-0.0",
      TransferSyntaxUID,
      ImplementationClassUID:
          "2.25.80302813137786398554742050926734630921603366648225212145404",
      FileMetaInformationVersion: fileMetaInformationVersionArray.buffer
  };

  const denaturalized = DicomMetaDictionary.denaturalizeDataset(
      dataset._meta
  );
  const dicomDict = new DicomDict(denaturalized);
  dicomDict.dict = DicomMetaDictionary.denaturalizeDataset(dataset);
  return dicomDict;
}
