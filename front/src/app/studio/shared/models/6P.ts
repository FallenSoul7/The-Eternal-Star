import { ExplorerNode } from '../StudioLayout'

export const model6P: ExplorerNode[] = [
  // Renamed from erik.cassel to a standard Dummy
  { id: 'char_dummy', name: 'Dummy', type: 'Model', parentId: 'workspace', position: '0, 18, 22.5', size: '4, 5, 1', anchored: false, color: '', material: 'Plastic' },
  
  // Generic IDs for the 6 body parts + Root
  { id: 'dummy_root', name: 'HumanoidRootPart', type: 'Part', parentId: 'char_dummy', position: '0, 18, 22.5', size: '2, 2, 1', anchored: false, color: '#a3a2a5', material: 'Plastic' },
  { id: 'dummy_head', name: 'Head', type: 'Part', parentId: 'char_dummy', position: '0, 19.5, 22.5', size: '2, 1, 1', anchored: false, color: '#a3a2a5', material: 'Plastic' },
  { id: 'dummy_torso', name: 'Torso', type: 'Part', parentId: 'char_dummy', position: '0, 18, 22.5', size: '2, 2, 1', anchored: false, color: '#a3a2a5', material: 'Plastic' },
  { id: 'dummy_larm', name: 'Left Arm', type: 'Part', parentId: 'char_dummy', position: '1.5, 18, 22.5', size: '1, 2, 1', anchored: false, color: '#a3a2a5', material: 'Plastic' },
  { id: 'dummy_rarm', name: 'Right Arm', type: 'Part', parentId: 'char_dummy', position: '-1.5, 18, 22.5', size: '1, 2, 1', anchored: false, color: '#a3a2a5', material: 'Plastic' },
  { id: 'dummy_lleg', name: 'Left Leg', type: 'Part', parentId: 'char_dummy', position: '0.5, 16, 22.5', size: '1, 2, 1', anchored: false, color: '#a3a2a5', material: 'Plastic' },
  { id: 'dummy_rleg', name: 'Right Leg', type: 'Part', parentId: 'char_dummy', position: '-0.5, 16, 22.5', size: '1, 2, 1', anchored: false, color: '#a3a2a5', material: 'Plastic' },
]
