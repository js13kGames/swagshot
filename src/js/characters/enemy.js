class Enemy extends Character {
    constructor() {
        super();

        const settings = pick([
            {
                'sprites': ROBOT_1,
                'z': -BLOCK_SIZE / 2,
                'weaponType': EnemyBurstWeapon
            },
            {
                'sprites': ROBOT_3,
                'z': rnd(1.5, 2.5) * BLOCK_SIZE,
                'weaponType': EnemyFireWeapon
            },
            {
                'sprites': ROBOT_2,
                'z': -BLOCK_SIZE / 2,
                'weaponType': EnemySpreadWeapon
            }
        ]);

        this.idleCanvas = settings.sprites[0];
        this.aggressiveCanvas = settings.sprites[1];
        this.hurtCanvas = settings.sprites[2];

        this.width = this.idleCanvas.width * 0.3;
        this.height = this.idleCanvas.height * 0.3;

        this.z = settings.z + this.idleCanvas.height * 0.3 / 2;

        SPRITES.push(this.sprite = {
            'x': this.x,
            'y': this.y,
            'z': this.z,
            'width': this.width,
            'height': this.height,
            'sprite': this.spriteCanvas
        });
        CYCLABLES.push(this);
        ENEMIES.push(this);
        MINIMAP_ELEMENTS.push(this);

        SPRITES.push(this.shadowSprite = {
            'x': this.x,
            'y': this.y,
            'z': -BLOCK_SIZE / 2,
            'width': this.width / 2,
            'height': this.height / 8,
            'sprite': SHADOW_CIRCLE
        });

        this.enemies = [P];

        this.nextTrajectory = 0;
        this.nextShot = 0;

        this.radius = this.width * 0.6;

        this.setWeapon(new settings.weaponType(this));
    }

    bloodParticleColor() {
        return pick(['#111', '#333', '#222', '#ff0', '#f80']);
    }

    setWeapon(weapon) {
        super.setWeapon(weapon);
        weapon.ammoPerShot = 0;
    }

    cycle(e) {
        super.cycle(e);

        if (G.clock >= this.nextTrajectory || dist(this, this.target) < 10) {
            this.aggressive = dist(P, this) < BLOCK_SIZE * 5 && P.health;

            const referencePoint = this.aggressive ? P : this;
            this.target = {
                'x': limit(0, referencePoint.x + rnd(-1, 1) * BLOCK_SIZE * 4, W.matrix[0].length * BLOCK_SIZE),
                'y': limit(0, referencePoint.y + rnd(-1, 1) * BLOCK_SIZE * 4, W.matrix.length * BLOCK_SIZE),
            };
            this.nextTrajectory = G.clock + 2;
            this.aggressive = dist(P, this) < BLOCK_SIZE * 8;
        }

        const angleDiff = normalize(angleBetween(this, this.target) - this.angle);
        this.angle += limit(-e * PI / 4, angleDiff, e * PI / 4);

        const speed = this.aggressive ? 200 : 100;
        this.moveBy(
            cos(this.angle) * e * speed,
            sin(this.angle) * e * speed
        );

        this.sprite.x = this.x;
        this.sprite.y = this.y;
        this.sprite.z = this.z;

        this.shadowSprite.x = this.x + cos(P.angle);
        this.shadowSprite.y = this.y + sin(P.angle);

        if (dist(this, P) < this.width * 1.2 && this.z - P.z < this.height / 2 && P.health) {
            const angle = angleBetween(this, P);

            const newX = this.x + cos(angle) * this.width * 1.2;
            const newY = this.y + sin(angle) * this.width * 1.2;

            P.moveBy(newX - P.x, newY - P.y);
        }

        this.sprite.sprite = G.clock - this.lastDamage < 0.05 ? this.hurtCanvas : (this.aggressive ? this.aggressiveCanvas : this.idleCanvas);
    }

    die() {
        super.die();

        remove(CYCLABLES, this);
        remove(SPRITES, this.shadowSprite);
        remove(ENEMIES, this);
        remove(MINIMAP_ELEMENTS, this);

        const duration = abs(-BLOCK_SIZE / 4 - this.z) / BLOCK_SIZE;
        interp(this.sprite, 'z', this.z, -BLOCK_SIZE / 2 + this.idleCanvas.height * 0.3 / 2, duration);
        interp(this.sprite, 'f', 0, 0, 0, duration + 0.5, null, () => {
            remove(SPRITES, this.sprite);
        });

        dropFire(this.x, this.y, this.z);

        this.sprite.sprite = this.hurtCanvas;
    }

    hurt(source, amount) {
        super.hurt(source, amount);
        P.lastHit = G.clock;
    }

    shootAngle() {
        return angleBetween(this, P);
    }

    shootVerticalAngle() {
        return atan2(-(P.z - this.z), P.x - this.x);
    }
}
