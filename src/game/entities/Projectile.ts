import { Vector2D } from '../types';

export class Projectile {
  position: Vector2D;
  velocity: Vector2D;
  damage: number;
  speed: number;
  active: boolean;

  constructor(position: Vector2D, angle: number, speed = 10, damage = 20) {
    this.position = { ...position };
    this.speed = speed;
    this.damage = damage;
    this.active = true;
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed,
    };
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}