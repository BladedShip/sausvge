import './styles.css';

const container = document.getElementById('root');
if (container) {
  let board = Array(9).fill('');
  let currentPlayer = 'X';
  let gameOver = false;
  let xWins = 0;
  let oWins = 0;
  let draws = 0;

  function checkWinner() {
    const winPatterns = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
      [0, 4, 8], [2, 4, 6] // diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    if (board.every(cell => cell !== '')) {
      return 'draw';
    }

    return null;
  }

  function handleCellClick(index) {
    if (gameOver || board[index] !== '') return;

    board[index] = currentPlayer;
    render();

    const winner = checkWinner();
    if (winner) {
      gameOver = true;
      if (winner === 'X') {
        xWins++;
        showMessage('X wins!');
      } else if (winner === 'O') {
        oWins++;
        showMessage('O wins!');
      } else {
        draws++;
        showMessage('Draw!');
      }
      updateStats();
    } else {
      currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
      updateCurrentPlayer();
    }
  }

  function resetGame() {
    board = Array(9).fill('');
    currentPlayer = 'X';
    gameOver = false;
    render();
    updateCurrentPlayer();
    const msgEl = document.querySelector('[data-message]');
    if (msgEl) msgEl.textContent = '';
  }

  function showMessage(text) {
    const msgEl = document.querySelector('[data-message]');
    if (msgEl) msgEl.textContent = text;
  }

  function updateCurrentPlayer() {
    const playerEl = document.querySelector('[data-current-player]');
    if (playerEl) playerEl.textContent = `Current Player: ${currentPlayer}`;
  }

  function updateStats() {
    const xWinsEl = document.querySelector('[data-x-wins]');
    const oWinsEl = document.querySelector('[data-o-wins]');
    const drawsEl = document.querySelector('[data-draws]');
    if (xWinsEl) xWinsEl.textContent = xWins;
    if (oWinsEl) oWinsEl.textContent = oWins;
    if (drawsEl) drawsEl.textContent = draws;
  }

  function render() {
    const boardElement = document.querySelector('[data-board]');
    if (!boardElement) return;
    
    boardElement.innerHTML = '';
    
    // Use SVGApp.createSVGElement if available (like calculator example)
    // This ensures elements are created in the correct XHTML namespace
    const createElement = (typeof SVGApp !== 'undefined' && SVGApp.createSVGElement)
      ? SVGApp.createSVGElement
      : function(tag, className) {
          const XHTML_NS = "http://www.w3.org/1999/xhtml";
          const elem = document.createElementNS(XHTML_NS, tag);
          if (className) elem.setAttribute("class", className);
          return elem;
        };
    
    for (let i = 0; i < 9; i++) {
      const cell = createElement('div', 'cell');
      cell.textContent = board[i];
      cell.addEventListener('click', () => handleCellClick(i));
      if (board[i]) {
        cell.classList.add('filled');
      }
      boardElement.appendChild(cell);
    }
  }

  // Initial render
  container.innerHTML = `
    <div class="app-container">
      <h1>SVG Vanilla Tic-Tac-Toe</h1>
      <p class="subtitle">A classic game built with vanilla JavaScript</p>
      
      <div class="game-info">
        <p data-current-player="">Current Player: X</p>
        <p data-message="" class="message"></p>
      </div>

      <div data-board="" class="board"></div>

      <div class="controls">
        <button data-reset="" class="reset-btn">New Game</button>
      </div>

      <div class="stats">
        <h2>Statistics</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-label">X Wins:</span>
            <span data-x-wins="" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">O Wins:</span>
            <span data-o-wins="" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Draws:</span>
            <span data-draws="" class="stat-value">0</span>
          </div>
        </div>
      </div>
    </div>
  `;

  const resetBtn = document.querySelector('[data-reset]');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetGame);
  }
  render();
  updateStats();
}
