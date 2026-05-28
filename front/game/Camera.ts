import * as THREE from 'three'
import { OrbitCameraFollowSystem } from './ecs/system/OrbitCameraFollowSystem'
import { Entity } from '@shared/entity/Entity'
import { InputMessage } from '@shared/network/client/inputMessage'
import { PlayerComponent } from '@shared/component/PlayerComponent' // ✅ Added import

export class Camera extends THREE.PerspectiveCamera {
  defaultOffset = new THREE.Vector3(0, 20, 40) // ✅ Moved default view up and back so you can see the map
  controlSystem: OrbitCameraFollowSystem

  constructor(renderer: THREE.WebGLRenderer) {
    super(70, window.innerWidth / window.innerHeight)
    this.position.copy(this.defaultOffset)
    this.controlSystem = new OrbitCameraFollowSystem(this, renderer)
  }

  update(dt: number, entities: Entity[], inputMessage: InputMessage) {
    // ✅ Check if any player entity actually exists in the game right now
    const hasPlayer = entities.some(entity => entity.components.has('PlayerComponent') || entity.getComponent?.(PlayerComponent))

    if (hasPlayer) {
      // If a player exists, let the camera follow them normally
      this.controlSystem.update(dt, entities, inputMessage)
    } else {
      // ✅ FAILSAFE: If no player spawned, force camera to look at the center of your FlatMap!
      this.position.set(0, 30, 50) // Sit high above the center
      this.lookAt(new THREE.Vector3(0, 0, 0)) // Look directly down at the map center
    }
  }
}
