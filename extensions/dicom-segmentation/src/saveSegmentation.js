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

  let imagePromises = [];
  for (let i = 0; i < imageIds.length; i++) {
    imagePromises.push(cornerstone.loadImage(imageIds[i]));
  }

  Promise.all(imagePromises)
    .then(async images => {
      //set the missing data property in all images
      images = images.map(async image => ({ ...image, data: await getDataForImageID(image.imageId) }));
      return Promise.all(images);
    }).then(async images => {
      const segBlob = generateSegmentation(
        images,
        labelmaps3D
      );

      //Create a URL for the binary.
      var objectUrl = URL.createObjectURL(segBlob);
      window.open(objectUrl);
    })
    .catch(err => console.log(err));
}

const wadorsRetriever = (
  url,
  studyInstanceUID,
  seriesInstanceUID,
  sopInstanceUID,
  headers = DICOMWeb.getAuthorizationHeader(),
  errorInterceptor = errorHandler.getHTTPErrorHandler()
) => {
  const config = {
    url,
    headers,
    errorInterceptor,
  };
  const dicomWeb = new api.DICOMwebClient(config);

  return dicomWeb.retrieveInstance({
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUID,
  });
};


async function getDataForImageID(imageId) {
  const {
    scheme,
    baseurl,
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUID,
    frame,
  } = parseImageId(imageId);
  const arrayBuffer = await wadorsRetriever(
    baseurl,
    studyInstanceUID,
    seriesInstanceUID,
    sopInstanceUID
  );

  const byteArray = new Uint8Array(arrayBuffer);
  //use dicomParser to get a dataset object
  const dataset = dicomParser.parseDicom(byteArray, { untilTag: '' });
  return dataset;
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
* @param  {object[]} images An array of cornerstone images that contain the source
*                           data under `image.data.byteArray.buffer`.
* @param  {Object|Object[]} inputLabelmaps3D The cornerstone `Labelmap3D` object, or an array of objects.
* @param  {Object} userOptions Options to pass to the segmentation derivation and `fillSegmentation`.
* @returns {Blob}
*/
function generateSegmentation(images, inputLabelmaps3D, userOptions = {}) {
  const isMultiframe = images[0].imageId.includes("?frame");
  const segmentation = _createSegFromImages(
      images,
      isMultiframe,
      userOptions
  );

  return fillSegmentation(segmentation, inputLabelmaps3D, userOptions);
}

/**
* fillSegmentation - Fills a derived segmentation dataset with cornerstoneTools `LabelMap3D` data.
*
* @param  {object[]} segmentation An empty segmentation derived dataset.
* @param  {Object|Object[]} inputLabelmaps3D The cornerstone `Labelmap3D` object, or an array of objects.
* @param  {Object} userOptions Options object to override default options.
* @returns {Blob}           description
*/
function fillSegmentation(segmentation, inputLabelmaps3D, userOptions = {}) {
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

  const segBlob = datasetToBlob(segmentation.dataset);

  return segBlob;
}


/**
 * _createSegFromImages - description
 *
 * @param  {Object[]} images    An array of the cornerstone image objects.
 * @param  {Boolean} isMultiframe Whether the images are multiframe.
 * @returns {Object}              The Seg derived dataSet.
 */
 function _createSegFromImages(images, isMultiframe, options) {
  const datasets = [];

  if (isMultiframe) {
      const image = images[0];
      const arrayBuffer = image.data.byteArray.buffer;

      const dicomData = DicomMessage.readFile(arrayBuffer);
      const dataset = DicomMetaDictionary.naturalizeDataset(dicomData.dict);

      dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);

      datasets.push(dataset);
  } else {
      for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const arrayBuffer = image.data.byteArray.buffer;
          const dicomData = DicomMessage.readFile(arrayBuffer);
          const dataset = DicomMetaDictionary.naturalizeDataset(
              dicomData.dict
          );

          dataset._meta = DicomMetaDictionary.namifyDataset(dicomData.meta);
          datasets.push(dataset);
      }
  }

  console.log("datasets"); console.log(datasets);
  const multiframe = Normalizer.normalizeToDataset(datasets);
  return new SegmentationDerivation([multiframe], options);
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

function datasetToBuffer(dataset) {
  return Buffer.from(datasetToDict(dataset).write());
}

function datasetToBlob(dataset) {
  const buffer = datasetToBuffer(dataset);
  return new Blob([buffer], { type: "application/dicom" });
}
