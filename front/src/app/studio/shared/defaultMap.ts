/**
 * DEFAULT_EMPTY_MAP
 * This is the master blueprint for your studio's initial state.
 * It composes various modules to keep the codebase clean.
 */

import { ExplorerNode } from '../StudioLayout'
import { coreServices } from './coreServices'
import { defaultEnvironment } from './environment'
import { model6P } from './models/6P'

// You can add more modules here as you build them, 
// e.g., import { defaultLighting } from './lighting'

export const DEFAULT_EMPTY_MAP: ExplorerNode[] = [
  // 1. Core Folders (Workspace, Lighting, etc.)
  ...coreServices,

  // 2. Physical World (Baseplate, Spawns, Atmosphere)
  ...defaultEnvironment,

  // 3. Characters & Entities
  ...model6P,
]
