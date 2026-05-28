import * as THREE from 'three'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js'

export class LoadManager {
  private static instance: LoadManager
  private cache = new Map<string, THREE.Mesh>()
  dracoLoader = new DRACOLoader()
  gltfLoader = new GLTFLoader()

  private constructor() {
    // ✅ FIXED: Using Google's cloud decoder so it never looks for a missing local folder
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.5/')
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
  }

  static getInstance(): LoadManager {
    if (!LoadManager.instance) {
      LoadManager.instance = new LoadManager()
    }
    return LoadManager.instance
  }

  static glTFLoad(path: string): Promise<THREE.Mesh> {
    const instance = LoadManager.getInstance()

    // Check if the mesh is already in the cache
    if (instance.cache.has(path)) {
      const cachedMesh = instance.cache.get(path)!
      const clonedMesh = instance.cloneMesh(cachedMesh)
      return Promise.resolve(clonedMesh)
    }

    // If not, load the model and store the mesh in the cache
    return new Promise((resolve, reject) => {
      instance.gltfLoader.load(
        path,
        (gltf) => {
          const mesh = instance.extractMesh(gltf)
          if (mesh) {
            instance.cache.set(path, mesh)
            const clonedMesh = instance.cloneMesh(mesh)
            resolve(clonedMesh)
          } else {
            // ✅ FIXED: Fallback mesh so the game doesn't crash if an asset is bad
            console.warn(`No mesh found in model: ${path}. Creating fallback cube.`)
            resolve(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)))
          }
        },
        (xhr) => {
          if (xhr.total > 0) {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
          }
        },
        (error) => {
          // ✅ FIXED: If a link breaks, log it, spawn a placeholder box, and KEEP LOADING the game!
          console.error('Failed to load asset from path:', path, error)
          resolve(new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2)))
        }
      )
    })
  }

  private cloneMesh(mesh: THREE.Mesh): THREE.Mesh {
    const clonedMesh = SkeletonUtils.clone(mesh)
    clonedMesh.animations = mesh.animations
    clonedMesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material
        if (Array.isArray(material)) {
          child.material = material.map((m) => m.clone())
        } else {
          child.material = material.clone()
        }
      }
    })
    return clonedMesh as THREE.Mesh
  }

  private extractMesh(gltf: any): THREE.Mesh | null {
    let mesh = new THREE.Mesh()
    mesh.add(gltf.scene)
    mesh.animations = gltf.animations
    return mesh
  }
}
