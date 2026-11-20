// On-Foot Punch Combat System and Hit Detection Mechanics

export class CombatSystem {
  constructor() {
    this.punchCooldown = 0;
    this.punchAnim = 0;
  }

  update(dt) {
    if (this.punchCooldown > 0) {
      this.punchCooldown -= dt;
    }
    if (this.punchAnim > 0) {
      this.punchAnim -= dt * 0.2;
    }
  }

  punch(player, pedestrians, policeUnits, onWantedIncrease) {
    if (this.punchCooldown > 0 || player.inVehicle) return false;
    this.punchCooldown = 30; // frames
    this.punchAnim = 1.0;

    const reach = 45;
    const punchX = player.x + Math.cos(player.angle) * reach;
    const punchY = player.y + Math.sin(player.angle) * reach;

    let hitSomething = false;

    // Check pedestrians
    for (const ped of pedestrians) {
      const dist = Math.hypot(ped.x - punchX, ped.y - punchY);
      if (dist < 35) {
        ped.knockdown = 200; // frames knocked down
        ped.vx = Math.cos(player.angle) * 4;
        ped.vy = Math.sin(player.angle) * 4;
        hitSomething = true;
        if (onWantedIncrease) onWantedIncrease(1);
        break;
      }
    }

    return hitSomething;
  }

  drawPunch(ctx, player) {
    if (this.punchAnim <= 0 || player.inVehicle) return;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(35, 0, 12 * this.punchAnim, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
