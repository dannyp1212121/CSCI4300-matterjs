// Destructure Matter.js modules
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite,
      Events = Matter.Events;

// Define screen dimensions
const width = 800;
const height = 600;
const wallThickness = 100;

// Gameplay settings
const BALL_SPEED = 10;        // Constant ball speed
const MIN_X_RATIO = 0.4;      // Ball must always travel at least this much horizontally (0-1)
const SERVE_DELAY = 1500;      // ms pause before the ball launches after a point

// Score state
const score = { left: 0, right: 0 };
let serving = false;

// Create the physics engine
const engine = Engine.create();

// Turn off gravity for pong gameplay
engine.world.gravity.y = 0;
engine.world.gravity.x = 0;

// Create the renderer
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#f4f4f8'
    }
});

// Create boundary walls
const wallOptions = {
    isStatic: true,
    render: { fillStyle: '#222' }
};

const ground = Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, wallOptions);
const ceiling = Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, wallOptions);
const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, wallOptions);
const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, wallOptions);

// Paddles
const paddleWidth = 70;
const paddleHeight = 130;

const paddleLeft = Bodies.rectangle(60, height / 2, paddleWidth, paddleHeight, {
    isStatic: true,
    render: {
        sprite: {
            texture: 'images/left.png',
            xScale: 0.25,
            yScale: 0.25
        }
    }
});

const paddleRight = Bodies.rectangle(width - 60, height / 2, paddleWidth, paddleHeight, {
    isStatic: true,
    render: {
        sprite: {
            texture: 'images/right.png',
            xScale: 0.25,
            yScale: 0.25
        }
    }
});

// Yarn Ball
const ballRadius = 35;

const ball = Bodies.circle(width / 2, height / 2, ballRadius, {
    restitution: 1.0,  // Perfect bounciness
    friction: 0,       // No surface friction
    frictionAir: 0,    // No air resistance
    frictionStatic: 0,
    render: {
        sprite: {
            texture: 'images/yarn.png',
            xScale: 0.14,
            yScale: 0.14
        }
    }
});

// Add all bodies to the world
Composite.add(engine.world, [paddleLeft, paddleRight, ball, ground, ceiling, leftWall, rightWall]);

// Launch the ball in a random angle (within +/-30 degrees) toward a side.
// direction: -1 = toward left player, 1 = toward right player
function launchBall(direction) {
    const angle = (Math.random() * 60 - 30) * Math.PI / 180;
    Body.setVelocity(ball, {
        x: Math.cos(angle) * BALL_SPEED * direction,
        y: Math.sin(angle) * BALL_SPEED
    });
}

// Put the ball back in the center, wait, then serve
function resetBall(direction) {
    serving = true;
    Body.setPosition(ball, { x: width / 2, y: height / 2 });
    Body.setVelocity(ball, { x: 0, y: 0 });
    Body.setAngularVelocity(ball, 0);

    setTimeout(() => {
        launchBall(direction);
        serving = false;
    }, SERVE_DELAY);
}

// Initial serve
launchBall(Math.random() < 0.5 ? -1 : 1);

// Scoring: ball touching a side wall = point for the opposite player
Events.on(engine, 'collisionStart', (event) => {
    if (serving) return;

    for (const pair of event.pairs) {
        const other = pair.bodyA === ball ? pair.bodyB : (pair.bodyB === ball ? pair.bodyA : null);
        if (!other) continue;

        if (other === leftWall) {
            score.right++;
            resetBall(-1);   // serve toward the player who just lost the point
            break;
        }
        if (other === rightWall) {
            score.left++;
            resetBall(1);
            break;
        }
    }
});

// Keyboard controls setup
const keys = { w: false, s: false, ArrowUp: false, ArrowDown: false };

document.addEventListener('keydown', (e) => { if (e.key in keys) keys[e.key] = true; });
document.addEventListener('keyup', (e) => { if (e.key in keys) keys[e.key] = false; });

const paddleSpeed = 10;

Events.on(engine, 'beforeUpdate', () => {
    const halfPaddle = paddleHeight / 2;

    // Left Paddle Controls (W / S), prevent from going off screen
    if (keys.w && paddleLeft.position.y - halfPaddle > 10) {
        Body.setPosition(paddleLeft, { x: paddleLeft.position.x, y: paddleLeft.position.y - paddleSpeed });
    }
    if (keys.s && paddleLeft.position.y + halfPaddle < height - 10) {
        Body.setPosition(paddleLeft, { x: paddleLeft.position.x, y: paddleLeft.position.y + paddleSpeed });
    }

    // Right Paddle Controls (Up / Down), prevent from going off screen
    if (keys.ArrowUp && paddleRight.position.y - halfPaddle > 10) {
        Body.setPosition(paddleRight, { x: paddleRight.position.x, y: paddleRight.position.y - paddleSpeed });
    }
    if (keys.ArrowDown && paddleRight.position.y + halfPaddle < height - 10) {
        Body.setPosition(paddleRight, { x: paddleRight.position.x, y: paddleRight.position.y + paddleSpeed });
    }

    // Keep the ball at constant speed and a playable angle
    if (!serving) {
        let vx = ball.velocity.x;
        let vy = ball.velocity.y;
        const mag = Math.hypot(vx, vy) || 1;

        // Normalize to a direction vector
        let dx = vx / mag;
        let dy = vy / mag;

        // Prevent near-vertical bouncing: force a minimum horizontal component
        if (Math.abs(dx) < MIN_X_RATIO) {
            dx = (dx < 0 ? -1 : 1) * MIN_X_RATIO;
            dy = (dy < 0 ? -1 : 1) * Math.sqrt(1 - dx * dx);
        }

        Body.setVelocity(ball, { x: dx * BALL_SPEED, y: dy * BALL_SPEED });
    }
});

// Draw the scoreboard on top of the game canvas
Events.on(render, 'afterRender', () => {
    const ctx = render.context;
    ctx.save();
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = 'rgba(34, 34, 34, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(`${score.left}  :  ${score.right}`, width / 2, 60);
    ctx.restore();
});

// Run renderer and engine
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);