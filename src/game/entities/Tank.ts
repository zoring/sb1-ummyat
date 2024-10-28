import { Vector2D } from '../types';

export interface TankStats {
  maxHealth: number;
  maxArmor: number;
  maxEnergy: number;
  speed: number;
  damage: number;
  reloadSpeed: number;
}

export type TankType = 'normal' | 'fast' | 'heavy' | 'artillery';

export class Tank {
  position: Vector2D;
  rotation: number;
  turretRotation: number;
  speed: number;
  health: number;
  armor: number;
  energy: number;
  isPlayer: boolean;
  isInvulnerable: boolean;
  specialAbilityDuration: number;
  normalSpeed: number;
  type: TankType;
  stats: TankStats;
  level: number = 1;
  experience: number = 0;
  abilities: Set<string> = new Set();
  
  constructor(x: number, y: number, type: TankType = 'normal', isPlayer: boolean = false) {
    this.position = { x, y };
    this.rotation = 0;
    this.turretRotation = 0;
    this.type = type;
    this.isPlayer = isPlayer;
    this.isInvulnerable = false;
    this.specialAbilityDuration = 0;
    
    // Initialize base stats based on tank type
    this.stats = this.getBaseStats(type);
    
    // Set current values
    this.health = this.stats.maxHealth;
    this.armor = this.stats.maxArmor;
    this.energy = this.stats.maxEnergy;
    this.normalSpeed = this.stats.speed;
    this.speed = this.normalSpeed;

    // Initialize abilities
    if (isPlayer) {
      this.abilities.add('shield');
      this.abilities.add('boost');
    }
  }

  private getBaseStats(type: TankType): TankStats {
    switch (type) {
      case 'fast':
        return {
          maxHealth: 80,
          maxArmor: 60,
          maxEnergy: 120,
          speed: 6,
          damage: 15,
          reloadSpeed: 0.8
        };
      case 'heavy':
        return {
          maxHealth: 150,
          maxArmor: 120,
          maxEnergy: 80,
          speed: 3,
          damage: 25,
          reloadSpeed: 1.5
        };
      case 'artillery':
        return {
          maxHealth: 70,
          maxArmor: 50,
          maxEnergy: 100,
          speed: 2,
          damage: 40,
          reloadSpeed: 2
        };
      default:
        return {
          maxHealth: 100,
          maxArmor: 100,
          maxEnergy: 100,
          speed: 5,
          damage: 20,
          reloadSpeed: 1
        };
    }
  }

  public gainExperience(amount: number) {
    if (!this.isPlayer) return;
    
    this.experience += amount;
    const experienceNeeded = this.level * 100;
    
    if (this.experience >= experienceNeeded) {
      this.levelUp();
    }
  }

  private levelUp() {
    this.level++;
    this.experience = 0;
    
    // Improve stats
    this.stats.maxHealth += 10;
    this.stats.maxArmor += 5;
    this.stats.maxEnergy += 10;
    this.stats.damage += 2;
    
    // Heal on level up
    this.health = this.stats.maxHealth;
    this.armor = this.stats.maxArmor;
    this.energy = this.stats.maxEnergy;
    
    // Unlock new abilities at specific levels
    if (this.level === 3) this.abilities.add('repair');
    if (this.level === 5) this.abilities.add('emp');
    if (this.level === 7) this.abilities.add('multishot');
  }

  move(direction: Vector2D) {
    this.position.x += direction.x * this.speed;
    this.position.y += direction.y * this.speed;
  }

  rotateTurret(angle: number) {
    this.turretRotation = angle;
  }

  takeDamage(amount: number): boolean {
    if (this.isInvulnerable) return false;
    
    const damageReduction = this.armor / this.stats.maxArmor;
    const actualDamage = amount * (1 - damageReduction * 0.5);
    this.health = Math.max(0, this.health - actualDamage);
    
    // Reduce armor when taking damage
    this.armor = Math.max(0, this.armor - actualDamage * 0.2);
    
    return this.health <= 0;
  }

  useAbility(abilityName: string): boolean {
    if (!this.abilities.has(abilityName) || this.energy < 30) return false;
    
    this.energy -= 30;
    
    switch (abilityName) {
      case 'shield':
        this.isInvulnerable = true;
        this.specialAbilityDuration = Date.now() + 3000;
        break;
      case 'boost':
        this.speed = this.normalSpeed * 1.5;
        this.specialAbilityDuration = Date.now() + 5000;
        break;
      case 'repair':
        this.health = Math.min(this.stats.maxHealth, this.health + 30);
        this.armor = Math.min(this.stats.maxArmor, this.armor + 20);
        break;
      case 'emp':
        // EMP effect handled by GameEngine
        return true;
      case 'multishot':
        // Multishot effect handled by GameEngine
        return true;
    }
    
    return true;
  }

  update() {
    // Update ability effects
    if (this.specialAbilityDuration > 0 && Date.now() > this.specialAbilityDuration) {
      this.isInvulnerable = false;
      this.speed = this.normalSpeed;
      this.specialAbilityDuration = 0;
    }

    // Regenerate energy over time
    if (this.energy < this.stats.maxEnergy) {
      this.energy = Math.min(this.stats.maxEnergy, this.energy + 0.1);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    // Special ability effect
    if (this.isInvulnerable) {
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fill();
    }

    // Tank body color based on type
    const bodyColor = this.getTankColor();
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-20, -15, 40, 30);

    // Tracks
    ctx.fillStyle = this.getDarkerColor(bodyColor);
    ctx.fillRect(-22, -18, 44, 6);
    ctx.fillRect(-22, 12, 44, 6);

    // Turret
    ctx.rotate(this.turretRotation - this.rotation);
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-8, -8, 16, 16);
    
    // Different barrel lengths based on tank type
    const barrelLength = this.type === 'artillery' ? 30 : 20;
    ctx.fillRect(8, -3, barrelLength, 6);

    // Level indicator for player tank
    if (this.isPlayer) {
      ctx.rotate(-(this.turretRotation - this.rotation));
      ctx.fillStyle = '#fbbf24';
      ctx.font = '12px Arial';
      ctx.fillText(`Lv${this.level}`, -10, -30);
    }

    // Health bar
    ctx.rotate(-(this.turretRotation - this.rotation));
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-20, -25, 40, 4);
    ctx.fillStyle = this.health > this.stats.maxHealth * 0.5 ? '#22c55e' : '#ef4444';
    ctx.fillRect(-20, -25, (40 * this.health) / this.stats.maxHealth, 4);

    // Energy bar (only for player)
    if (this.isPlayer) {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(-20, -30, 40, 3);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(-20, -30, (40 * this.energy) / this.stats.maxEnergy, 3);
    }

    ctx.restore();
  }

  private getTankColor(): string {
    if (this.isPlayer) return '#4a5568';
    
    switch (this.type) {
      case 'fast': return '#dc2626';
      case 'heavy': return '#7f1d1d';
      case 'artillery': return '#991b1b';
      default: return '#991b1b';
    }
  }

  private getDarkerColor(color: string): string {
    return color === '#4a5568' ? '#2d3748' : '#7f1d1d';
  }
}