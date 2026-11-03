import type { FaceStage } from '../core/types'

export interface SceneSkin {
  id: 'fridge' | 'alarm' | 'ppt'
  setFace(stage: FaceStage, intensity: number): void
  setActing(acting: boolean): void
  onScore(score: number): void
  playCatch(): void
  draw(ctx: CanvasRenderingContext2D, t: number, w: number, h: number): void
}
