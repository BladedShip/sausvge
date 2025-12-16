import React, { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="counter">
      <div className="counter-display">{count}</div>
      <div className="counter-buttons">
        <button onClick={() => setCount((c) => c - 1)} className="btn-decrement">
          −
        </button>
        <button onClick={() => setCount(0)} className="btn-reset">
          Reset
        </button>
        <button onClick={() => setCount((c) => c + 1)} className="btn-increment">
          +
        </button>
      </div>
    </div>
  );
};

export default Counter;

