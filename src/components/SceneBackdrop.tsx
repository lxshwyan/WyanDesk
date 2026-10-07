import type { CSSProperties } from 'react';
import type { SceneId } from '../types';

interface SceneBackdropProps {
  scene: SceneId;
  motion: boolean;
  customBackground: string;
}

export function SceneBackdrop({ scene, motion, customBackground }: SceneBackdropProps) {
  const style = customBackground
    ? ({ '--custom-background': `url("${customBackground}")` } as CSSProperties)
    : undefined;

  return (
    <div className={`desktop-backdrop scene-${scene}${motion ? ' has-motion' : ''}${customBackground ? ' has-custom-background' : ''}`} style={style} aria-hidden="true">
      <div className="scene-wash" />
      <div className="scene-sun" />
      <div className="scene-orb scene-orb-one" />
      <div className="scene-orb scene-orb-two" />
      <div className="scene-ridge scene-ridge-back" />
      <div className="scene-ridge scene-ridge-front" />
      <div className="scene-grid-plane" />
      <div className="scene-haze" />
      <div className="scene-cyber-beam" />
      <div className="scene-cyber-ring scene-cyber-ring-one" />
      <div className="scene-cyber-ring scene-cyber-ring-two" />
      <div className="scene-cyber-points" />
    </div>
  );
}
