// TODO: Creation tools (future release).

const TOOLBAR_BUTTON_TYPES = {
  COMMAND: 'command',
  SET_TOOL_ACTIVE: 'setToolActive',
  BUILT_IN: 'builtIn',
};


const definitions =  [
      {
        id: 'FreehandScissors',
        label: 'Freehand',
        icon: 'circle-notch',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'FreehandScissors' },
      },
      // {
      //   id: 'Brush',
      //   label: 'Brush',
      //   icon: 'brush',
      //   //
      //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
      //   commandName: 'setToolActive',
      //   commandOptions: { toolName: 'Brush' },
      // },
      // {
      //   id: 'SphericalBrush',
      //   label: 'Spherical',
      //   icon: 'sphere',
      //   //
      //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
      //   commandName: 'setToolActive',
      //   commandOptions: { toolName: 'SphericalBrush' },
      // },
      {
        id: 'CorrectionScissors',
        label: 'Correction Scissors',
        icon: 'scissors',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'CorrectionScissors' },
      },
      // {
      //   id: 'BrushEraser',
      //   label: 'Eraser',
      //   icon: 'trash',
      //   //
      //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
      //   commandName: 'setToolActive',
      //   commandOptions: { toolName: 'BrushEraser' },
      // },
      {
        id: 'FreehandScissorsEraser',
        label: 'Scissors Eraser',
        icon: 'scissors',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'FreehandScissorsEraser' },
      },
      {
        id: 'Interpolation',
        label: 'Interpolation',
        icon: 'cube',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'Interpolation' },
      },
    ];

/*
const definitions =  [
  {
    id: 'SegDropdown',
    label: 'Segmentation',
    icon: 'ellipse-circle',
    buttons: [
      {
        id: 'FreehandScissors',
        label: 'Freehand',
        icon: 'circle-notch',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'FreehandScissors' },
      },
      // {
      //   id: 'Brush',
      //   label: 'Brush',
      //   icon: 'brush',
      //   //
      //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
      //   commandName: 'setToolActive',
      //   commandOptions: { toolName: 'Brush' },
      // },
      // {
      //   id: 'SphericalBrush',
      //   label: 'Spherical',
      //   icon: 'sphere',
      //   //
      //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
      //   commandName: 'setToolActive',
      //   commandOptions: { toolName: 'SphericalBrush' },
      // },
      {
        id: 'CorrectionScissors',
        label: 'Correction Scissors',
        icon: 'scissors',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'CorrectionScissors' },
      },
      // {
      //   id: 'BrushEraser',
      //   label: 'Eraser',
      //   icon: 'trash',
      //   //
      //   type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
      //   commandName: 'setToolActive',
      //   commandOptions: { toolName: 'BrushEraser' },
      // },
      {
        id: 'FreehandScissorsEraser',
        label: 'Scissors Eraser',
        icon: 'scissors',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'FreehandScissorsEraser' },
      },
      {
        id: 'Interpolation',
        label: 'Interpolation',
        icon: 'cube',
        //
        type: TOOLBAR_BUTTON_TYPES.SET_TOOL_ACTIVE,
        commandName: 'setToolActive',
        commandOptions: { toolName: 'Interpolation' },
      },
    ],
  },
];
 */
export default {
  definitions,
  defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
};
