const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startButton");
const scoreElement = document.getElementById("score");

const rows = 20;
const cols = 10;
const blockSize = 30;
const board = Array.from({ length: rows }, () => Array(cols).fill(0));

let gameOver = false;
let gamePaused = false;
let gameSpeed = 1000;
let score = 0;
let gameInterval = null;
let currentPiece;

// Asegurar que el canvas esté oculto al inicio
canvas.style.display = "none";

// Evento para iniciar el juego
startButton.addEventListener("click", () => {
    startButton.style.display = "none"; // Oculta el botón
    canvas.style.display = "block"; // Muestra el juego
    startGame();
});

// Función para iniciar el juego
function startGame() {
    gameOver = false;
    gamePaused = false;
    score = 0;
    updateScore();
    
    // Reiniciar el tablero y generar una nueva pieza
    board.forEach(row => row.fill(0));
    currentPiece = spawnNewPiece();
    
    // Iniciar el movimiento automático
    clearInterval(gameInterval);
    gameInterval = setInterval(moveDown, gameSpeed);
    updateGame();
}

// Función para actualizar la puntuación
function updateScore() {
    scoreElement.textContent = score;
}

// Dibujar el tablero
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (board[r][c]) {
                ctx.fillStyle = board[r][c];
                ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize);
                ctx.strokeRect(c * blockSize, r * blockSize, blockSize, blockSize);
            }
        }
    }

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        clearInterval(gameInterval);
    }
}

// Función para mover la pieza hacia abajo
function moveDown() {
    if (gameOver || gamePaused) return;
    if (canMove(currentPiece.row + 1, currentPiece.col, currentPiece.shape)) {
        currentPiece.row++;
    } else {
        mergePiece();
        removeFullLines();
        currentPiece = spawnNewPiece();
        checkGameOver();
    }
    updateGame();
}

// Función para mover la pieza a la izquierda o derecha
function movePiece(direction) {
    let newCol = currentPiece.col + direction;
    if (canMove(currentPiece.row, newCol, currentPiece.shape)) {
        currentPiece.col = newCol;
        updateGame();
    }
}

// Función para eliminar líneas completas
function removeFullLines() {
    let linesCleared = 0;
    for (let r = rows - 1; r >= 0; r--) {
        if (board[r].every(cell => cell !== 0)) {
            board.splice(r, 1);
            board.unshift(Array(cols).fill(0));
            linesCleared++;
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
        updateScore();
    }
}

// Función para verificar si el juego ha terminado
function checkGameOver() {
    if (board[0].some(cell => cell !== 0)) {
        gameOver = true;
        drawBoard();
        clearInterval(gameInterval);
    }
}

// Generar una nueva pieza aleatoria
function spawnNewPiece() {
    let tetrominoes = [
        { shape: [[1, 1, 1, 1]], color: "cyan" },  // I
        { shape: [[1, 1], [1, 1]], color: "yellow" },  // O
        { shape: [[0, 1, 0], [1, 1, 1]], color: "purple" },  // T
        { shape: [[1, 0, 0], [1, 1, 1]], color: "orange" },  // L
        { shape: [[0, 0, 1], [1, 1, 1]], color: "blue" },  // J
        { shape: [[0, 1, 1], [1, 1, 0]], color: "green" },  // S
        { shape: [[1, 1, 0], [0, 1, 1]], color: "red" }   // Z
    ];
    
    let randomIndex = Math.floor(Math.random() * tetrominoes.length);
    let piece = tetrominoes[randomIndex];
    return { 
        shape: piece.shape, 
        color: piece.color, 
        row: 0, 
        col: 4
    };
}

// Función para verificar si la pieza puede moverse
function canMove(newRow, newCol, newShape) {
    return newShape.every((row, rIndex) => 
        row.every((cell, cIndex) => {
            if (cell) {
                let targetRow = newRow + rIndex;
                let targetCol = newCol + cIndex;
                if (targetRow >= rows || targetCol < 0 || targetCol >= cols || board[targetRow][targetCol]) {
                    return false; // Colisión
                }
            }
            return true;
        })
    );
}

// Función para rotar la pieza
function rotatePiece(direction) {
    let rotatedShape = rotateMatrix(currentPiece.shape, direction);
    if (canMove(currentPiece.row, currentPiece.col, rotatedShape)) {
        currentPiece.shape = rotatedShape;
        updateGame();
    }
}

// Función para rotar una matriz (pieza)
function rotateMatrix(matrix, direction) {
    let rotated = matrix[0].map((_, i) =>
        matrix.map(row => row[i])
    );
    return direction === 1 ? rotated.reverse() : rotated.map(row => row.reverse());
}

// Fusionar la pieza con el tablero cuando toca el fondo
function mergePiece() {
    currentPiece.shape.forEach((row, rIndex) => {
        row.forEach((cell, cIndex) => {
            if (cell) {
                board[currentPiece.row + rIndex][currentPiece.col + cIndex] = currentPiece.color;
            }
        });
    });
}

// Manejo del teclado
document.addEventListener("keydown", (event) => {
    if (gameOver || gamePaused) return;

    if (event.key === "ArrowLeft") {
        movePiece(-1);
    } else if (event.key === "ArrowRight") {
        movePiece(1);
    } else if (event.key === "ArrowDown") {
        moveDown();
    } else if (event.key === "s") {
        rotatePiece(-1); // Rotación a la izquierda
    } else if (event.key === "f") {
        rotatePiece(1); // Rotación a la derecha
    }
});

// Función para actualizar el juego
function updateGame() {
    drawBoard();
    drawPiece();
}

// Dibujar la pieza actual
function drawPiece() {
    ctx.fillStyle = currentPiece.color;
    currentPiece.shape.forEach((row, rIndex) => {
        row.forEach((cell, cIndex) => {
            if (cell) {
                ctx.fillRect((currentPiece.col + cIndex) * blockSize, 
                             (currentPiece.row + rIndex) * blockSize, 
                             blockSize, blockSize);
                ctx.strokeRect((currentPiece.col + cIndex) * blockSize, 
                               (currentPiece.row + rIndex) * blockSize, 
                               blockSize, blockSize);
            }
        });
    });
}
