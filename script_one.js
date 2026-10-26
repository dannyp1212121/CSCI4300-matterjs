// Destructure matter.js modules
const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint;

// Define screen dimensions
const width = 800;
const height = 600;
const wallThickness = 100;

// Create the physics engine
const engine = Engine.create();

// Create the renderer
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: 800,
        height: 600,
        wireframes: false, // Solid colors
        background: '#f4f4f8'
    }
});

// Create boundary walls to prevent items from going off screen
const wallOptions = { 
    isStatic: true, 
    render: { fillStyle: '#222' } 
};

// Rectangles (x, y, width, height)
const ground = Bodies.rectangle(width / 2, height + wallThickness / 2, width, wallThickness, wallOptions);
const ceiling = Bodies.rectangle(width / 2, -wallThickness / 2, width, wallThickness, wallOptions);
const leftWall = Bodies.rectangle(-wallThickness / 2, height / 2, wallThickness, height, wallOptions);
const rightWall = Bodies.rectangle(width + wallThickness / 2, height / 2, wallThickness, height, wallOptions);

// Create two rectangles (x, y, width, height)
const boxA = Bodies.rectangle(400, 200, 80, 80, {
render: {
        sprite: {
            texture: '../images/catOne.png',
            xScale: 0.25,
            yScale: 0.25
        }
    }
});
const boxB = Bodies.rectangle(450, 50, 80, 80, {
render: {
        sprite: {
            texture: '../images/catOne.png',
            xScale: 0.25,
            yScale: 0.25
        }
    }
});

// Create a bouncing circle (x, y, radius)  
const circle = Bodies.circle(380, 100, 40, { 
    restitution: 0.9, // Makes the circle bouncy
    render: {
        sprite: {
            texture: '../images/yarn.png',
            xScale: 0.25,
            yScale: 0.25
        }
    }
});

// Add all bodies to the canvas
Composite.add(engine.world, [boxA, boxB, circle, ground, ceiling, leftWall, rightWall]);

// Add mouse interaction to drag items
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.2,
        render: { visible: false }
    }
});
Composite.add(engine.world, mouseConstraint);

// Keep mouse in sync with the renderer
render.mouse = mouse;

// Run the renderer and the engine
Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);