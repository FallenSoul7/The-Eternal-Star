import * as THREE from 'three'
import { OrbitCameraFollowSystem } from './ecs/system/OrbitCameraFollowSystem'
import { Entity } from '@shared/entity/Entity'
import { InputMessage } from '@shared/network/client/inputMessage'
import { PlayerComponent } from '@shared/component/PlayerComponent' 

export class Camera extends THREE.PerspectiveCamera {
  defaultOffset = new THREE.Vector3(0, 20, 40) 
  controlSystem: OrbitCameraFollowSystem

  constructor(renderer: THREE.WebGLRenderer) {
    super(70, window.innerWidth / window.innerHeight)
    this.position.copy(this.defaultOffset)
    this.controlSystem = new OrbitCameraFollowSystem(this, renderer)
  }

  update(dt: number, entities: Entity[], inputMessage: InputMessage) {
    // ✅ FIXED: Removed the string check. Now correctly passing the class constructor.
    const hasPlayer = entities.some(entity => entity.getComponent(PlayerComponent))

    if (hasPlayer) {
      // If a player exists, let the camera follow them normally
      this.controlSystem.update(dt, entities, inputMessage)
    } else {
      // FAILSAFE: If no player spawned, force camera to look at the center of your FlatMap!
      this.position.set(0, 30, 50) 
      this.lookAt(new THREE.Vector3(0, 0, 0)) 
    }
  }
}
