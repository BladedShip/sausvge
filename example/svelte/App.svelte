<script>
  let todos = [];
  let newTodo = '';
  let filter = 'all'; // 'all', 'active', 'completed'

  function addTodo() {
    if (newTodo.trim()) {
      todos = [...todos, { id: Date.now(), text: newTodo.trim(), completed: false }];
      newTodo = '';
    }
  }

  function toggleTodo(id) {
    todos = todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  }

  function removeTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
  }

  function clearCompleted() {
    todos = todos.filter(todo => !todo.completed);
  }

  $: filteredTodos = filter === 'all' 
    ? todos 
    : filter === 'active' 
    ? todos.filter(t => !t.completed)
    : todos.filter(t => t.completed);

  $: completedCount = todos.filter(t => t.completed).length;
  $: activeCount = todos.length - completedCount;
</script>

<div class="container">
  <div class="app-content">
    <h1>SVG Svelte Todo App</h1>
    <p class="subtitle">A reactive todo list with filtering</p>

    <div class="todo-input-section">
      <input
        type="text"
        placeholder="Add a new todo..."
        bind:value={newTodo}
        on:keydown={(e) => e.key === 'Enter' && addTodo()}
        class="todo-input"
      />
      <button on:click={addTodo} class="add-button">Add</button>
    </div>

    <div class="filter-buttons">
      <button
        class="filter-btn"
        class:active={filter === 'all'}
        on:click={() => filter = 'all'}
      >
        All ({todos.length})
      </button>
      <button
        class="filter-btn"
        class:active={filter === 'active'}
        on:click={() => filter = 'active'}
      >
        Active ({activeCount})
      </button>
      <button
        class="filter-btn"
        class:active={filter === 'completed'}
        on:click={() => filter = 'completed'}
      >
        Completed ({completedCount})
      </button>
    </div>

    <div class="todo-list">
      {#each filteredTodos as todo (todo.id)}
        <div class="todo-item" class:completed={todo.completed}>
          <input
            type="checkbox"
            checked={todo.completed}
            on:change={() => toggleTodo(todo.id)}
            class="todo-checkbox"
          />
          <span class="todo-text">{todo.text}</span>
          <button on:click={() => removeTodo(todo.id)} class="remove-button">×</button>
        </div>
      {:else}
        <div class="empty-state">No todos found</div>
      {/each}
    </div>

    {#if completedCount > 0}
      <button on:click={clearCompleted} class="clear-button">
        Clear Completed ({completedCount})
      </button>
    {/if}
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100%;
    padding: 2rem;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    color: white;
  }

  .app-content {
    width: 100%;
    max-width: 600px;
  }

  h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
    text-align: center;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  .subtitle {
    text-align: center;
    font-size: 1.1rem;
    margin: 0 0 2rem 0;
    opacity: 0.9;
  }

  .todo-input-section {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .todo-input {
    flex: 1;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-family: inherit;
  }

  .todo-input::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  .todo-input:focus {
    outline: none;
    border-color: white;
    background: rgba(255, 255, 255, 0.3);
  }

  .add-button {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    background: white;
    color: #f5576c;
    border: none;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .add-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .filter-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    justify-content: center;
  }

  .filter-btn {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .filter-btn.active {
    background: white;
    color: #f5576c;
    border-color: white;
  }

  .todo-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .todo-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .todo-item.completed .todo-text {
    text-decoration: line-through;
    opacity: 0.6;
  }

  .todo-checkbox {
    width: 20px;
    height: 20px;
    cursor: pointer;
  }

  .todo-text {
    flex: 1;
    font-size: 1rem;
  }

  .remove-button {
    width: 28px;
    height: 28px;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 50%;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .remove-button:hover {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.1);
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    opacity: 0.7;
    font-style: italic;
  }

  .clear-button {
    width: 100%;
    padding: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    transition: all 0.2s;
  }

  .clear-button:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
</style>
