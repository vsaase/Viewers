import csTools from 'cornerstone-tools';
import DICOMSegTempCrosshairsTool from './tools/DICOMSegTempCrosshairsTool';

/**
 *
 * @param {object} configuration
 * @param {Object|Array} configuration.csToolsConfig
 */
export default function init({ servicesManager, configuration = {} }) {
  const { FreehandScissorsTool, BrushTool, SphericalBrushTool, CorrectionScissorsTool, InterpolationTool } = csTools;
  const tools = [FreehandScissorsTool, BrushTool, SphericalBrushTool, CorrectionScissorsTool, InterpolationTool];

  tools.forEach(tool => csTools.addTool(tool));

  csTools.addTool(BrushTool, {
    name: 'BrushEraser',
    configuration: {
      alwaysEraseOnClick: true,
    },
  });

  csTools.addTool(FreehandScissorsTool, {
    name: "FreehandScissorsEraser",
    defaultStrategy: 'ERASE_INSIDE'
  })

  csTools.addTool(DICOMSegTempCrosshairsTool);
}
