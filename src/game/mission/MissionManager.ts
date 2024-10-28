import { Vector2D } from '../types';
import { Tank } from '../entities/Tank';
import { GameEngine } from '../GameEngine';

export interface MissionObjective {
  type: 'destroy' | 'protect' | 'reach' | 'survive' | 'escort';
  target?: Tank;
  position?: Vector2D;
  progress: number;
  required: number;
  completed: boolean;
  description: string;
}

export interface Mission {
  id: number;
  name: string;
  description: string;
  objectives: MissionObjective[];
  timeLimit?: number;
  startTime: number;
  completed: boolean;
  rewards: {
    experience: number;
    upgrades: string[];
  };
}

export class MissionManager {
  private currentMission: Mission | null = null;
  private gameEngine: GameEngine;
  private escortTarget: Tank | null = null;
  private checkpoints: Vector2D[] = [];
  private currentCheckpoint: number = 0;

  constructor(gameEngine: GameEngine) {
    this.gameEngine = gameEngine;
  }

  public startMission(missionId: number) {
    this.currentMission = this.createMission(missionId);
    this.initializeMissionElements();
  }

  private createMission(id: number): Mission {
    switch (id) {
      case 1:
        return {
          id: 1,
          name: '森林遭遇战',
          description: '消灭森林中的敌方坦克，注意隐蔽的敌人！',
          objectives: [
            {
              type: 'destroy',
              progress: 0,
              required: 5,
              completed: false,
              description: '消灭敌方坦克'
            }
          ],
          startTime: Date.now(),
          completed: false,
          rewards: {
            experience: 200,
            upgrades: ['armor_boost']
          }
        };

      case 2:
        return {
          id: 2,
          name: '护送任务',
          description: '护送运输车安全通过敌占区',
          objectives: [
            {
              type: 'escort',
              progress: 0,
              required: 3,
              completed: false,
              description: '护送运输车到达指定位置'
            },
            {
              type: 'survive',
              progress: 0,
              required: 180, // 3 minutes
              completed: false,
              description: '保持运输车存活'
            }
          ],
          timeLimit: 180,
          startTime: Date.now(),
          completed: false,
          rewards: {
            experience: 300,
            upgrades: ['speed_boost']
          }
        };

      default:
        throw new Error(`Mission ${id} not found`);
    }
  }

  private initializeMissionElements() {
    if (!this.currentMission) return;

    switch (this.currentMission.id) {
      case 2:
        // Create escort target for escort mission
        this.escortTarget = new Tank(100, 100, 'heavy');
        this.checkpoints = [
          { x: 500, y: 500 },
          { x: 1500, y: 1500 },
          { x: 2500, y: 2500 }
        ];
        break;
    }
  }

  public update() {
    if (!this.currentMission) return;

    const currentTime = Date.now();
    const elapsedTime = (currentTime - this.currentMission.startTime) / 1000;

    this.currentMission.objectives.forEach(objective => {
      switch (objective.type) {
        case 'destroy':
          objective.progress = this.gameEngine.getDestroyedEnemyCount();
          break;

        case 'survive':
          objective.progress = Math.min(elapsedTime, objective.required);
          break;

        case 'escort':
          if (this.escortTarget && this.currentCheckpoint < this.checkpoints.length) {
            const checkpoint = this.checkpoints[this.currentCheckpoint];
            const distance = this.getDistance(this.escortTarget.position, checkpoint);
            
            if (distance < 50) {
              this.currentCheckpoint++;
              objective.progress++;
            }
          }
          break;
      }

      objective.completed = objective.progress >= objective.required;
    });

    // Check if all objectives are completed
    if (this.currentMission.objectives.every(obj => obj.completed)) {
      this.completeMission();
    }

    // Check for mission failure conditions
    if (this.currentMission.timeLimit && elapsedTime > this.currentMission.timeLimit) {
      this.failMission();
    }
  }

  private getDistance(pos1: Vector2D, pos2: Vector2D): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private completeMission() {
    if (!this.currentMission || this.currentMission.completed) return;

    this.currentMission.completed = true;
    const playerTank = this.gameEngine.getPlayerTank();
    
    if (playerTank) {
      playerTank.gainExperience(this.currentMission.rewards.experience);
      this.currentMission.rewards.upgrades.forEach(upgrade => {
        // Apply upgrades
        this.gameEngine.applyUpgrade(playerTank, upgrade);
      });
    }
  }

  private failMission() {
    // Handle mission failure
    this.gameEngine.endGame('mission_failed');
  }

  public getCurrentMission(): Mission | null {
    return this.currentMission;
  }

  public getEscortTarget(): Tank | null {
    return this.escortTarget;
  }

  public getNextCheckpoint(): Vector2D | null {
    return this.checkpoints[this.currentCheckpoint] || null;
  }
}