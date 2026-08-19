import { useState, useEffect } from 'react';

function App() {
  const [taskText, setTaskText] = useState('');

  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('myTasks');
    return savedTasks ? JSON.parse(savedTasks) : [
      { id: 1, text: 'Task One', completed: false },
      { id: 2, text: 'Task Two', completed: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem('myTasks', JSON.stringify(tasks));
  }, [tasks]);


  // 1. Add Task
  const handleAddTask = () => {
    if (taskText.trim() === '') return;
    const newTask = { id: Date.now(), text: taskText, completed: false };
    setTasks([...tasks, newTask]);
    setTaskText('');
  };

  // 2. Delete Task
  const handleDeleteTask = (idToDelete) => {
    setTasks(tasks.filter((task) => task.id !== idToDelete));
  };

  // 3. Toggle Done / Undo
  const handleToggleTask = (idToToggle) => {
    setTasks(
      tasks.map((task) =>
        task.id === idToToggle ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // 4. Edit Task
  const handleEditTask = (idToEdit) => {
    const currentTask = tasks.find((task) => task.id === idToEdit);
    const newText = prompt('Edit your task:', currentTask ? currentTask.text : '');
    if (!newText || newText.trim() === '') return;

    setTasks(
      tasks.map((task) =>
        task.id === idToEdit ? { ...task, text: newText } : task
      )
    );
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '440px', margin: 'auto', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%' }}>
      <h2 style={{ textAlign: 'center' }}>Quick Tasks Panel</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Write your new task"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          style={{ flex: '1', padding: '8px' }}
        />
        <button onClick={handleAddTask} style={{ padding: '8px 16px', cursor: 'pointer' }}> Add </button>
      </div>

      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid #ccc',
            padding: '12px',
            marginBottom: '10px',
            borderRadius: '6px',
            backgroundColor: task.completed ? '#f0fdf4' : '#fff'
          }}
        >
          <span
            style={{
              textDecoration: task.completed ? 'line-through' : 'none',
              color: task.completed ? '#888' : '#000'
            }}
          >
            {task.text}
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => handleToggleTask(task.id)}
              style={{ padding: '4px 8px', color: 'black', cursor: 'pointer' }}
            >
              {task.completed ? 'Undo' : 'Done'}
            </button>
            <button
              onClick={() => handleEditTask(task.id)}
              style={{ padding: '4px 8px', color: 'blue', cursor: 'pointer' }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteTask(task.id)}
              style={{ padding: '4px 8px', color: 'red', cursor: 'pointer' }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;