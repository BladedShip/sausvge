import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
// Use the importable runtime instead of declaring global
import { SVGApp } from 'sausvge/runtime';
import './styles.css';

// 1. Context & Reducer for State Management
type State = {
  todos: { id: number; text: string; completed: boolean }[];
  filter: 'all' | 'active' | 'completed';
};

type Action =
  | { type: 'ADD_TODO'; payload: string }
  | { type: 'TOGGLE_TODO'; payload: number }
  | { type: 'DELETE_TODO'; payload: number }
  | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'completed' }
  | { type: 'LOAD_STATE'; payload: State };

const initialState: State = {
  todos: [],
  filter: 'all',
};

const TodoContext = createContext<{ state: State; dispatch: React.Dispatch<Action> }>({
  state: initialState,
  dispatch: () => null,
});

function todoReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_TODO':
      return {
        ...state,
        todos: [
          ...state.todos,
          { id: Date.now(), text: action.payload, completed: false },
        ],
      };
    case 'TOGGLE_TODO':
      return {
        ...state,
        todos: state.todos.map((todo) =>
          todo.id === action.payload ? { ...todo, completed: !todo.completed } : todo
        ),
      };
    case 'DELETE_TODO':
      return {
        ...state,
        todos: state.todos.filter((todo) => todo.id !== action.payload),
      };
    case 'SET_FILTER':
      return { ...state, filter: action.payload };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
}

// 2. Components
const TodoItem = ({ todo }: { todo: State['todos'][0] }) => {
  const { dispatch } = useContext(TodoContext);
  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => dispatch({ type: 'TOGGLE_TODO', payload: todo.id })}
      />
      <span>{todo.text}</span>
      <button onClick={() => dispatch({ type: 'DELETE_TODO', payload: todo.id })}>
        Delete
      </button>
    </div>
  );
};

const TodoList = () => {
  const { state } = useContext(TodoContext);
  const filteredTodos = state.todos.filter((todo) => {
    if (state.filter === 'active') return !todo.completed;
    if (state.filter === 'completed') return todo.completed;
    return true;
  });

  return (
    <div className="todo-list">
      {filteredTodos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
      {filteredTodos.length === 0 && <p>No items found</p>}
    </div>
  );
};

const AddTodo = () => {
  const [text, setText] = useState('');
  const { dispatch } = useContext(TodoContext);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      dispatch({ type: 'ADD_TODO', payload: text });
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-todo">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new task..."
      />
      <button type="submit">Add</button>
    </form>
  );
};

const Filter = () => {
  const { state, dispatch } = useContext(TodoContext);
  return (
    <div className="filters">
      {(['all', 'active', 'completed'] as const).map((f) => (
        <button
          key={f}
          className={state.filter === f ? 'active' : ''}
          onClick={() => dispatch({ type: 'SET_FILTER', payload: f })}
        >
          {f.charAt(0).toUpperCase() + f.slice(1)}
        </button>
      ))}
    </div>
  );
};

// 3. Main App with Persistence
const App = () => {
  const [state, dispatch] = useReducer(todoReducer, initialState);

  // Load from SVGApp storage on mount
  useEffect(() => {
    if (SVGApp) {
      const savedData = SVGApp.storage.getItem('todo_state');
      if (savedData) {
        console.log('Loaded state from storage:', savedData);
        dispatch({ type: 'LOAD_STATE', payload: savedData });
      }
    }
  }, []);

  // Save to SVGApp storage on change
  useEffect(() => {
    if (SVGApp) {
      SVGApp.storage.setItem('todo_state', state);
    }
  }, [state]);

  return (
    <TodoContext.Provider value={{ state, dispatch }}>
      <div className="app-container">
        <h1>Complex React App</h1>
        <p>Persists state using SVGApp.storage</p>
        <AddTodo />
        <Filter />
        <TodoList />
      </div>
    </TodoContext.Provider>
  );
};

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
