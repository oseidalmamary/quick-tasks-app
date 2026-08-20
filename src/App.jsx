import { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';

function App() {
  // --- User State (Authentication) ---
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // --- Tasks State ---
  const [taskText, setTaskText] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskTime, setTaskTime] = useState('');
  const [tasks, setTasks] = useState([]);

  // 1. Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch tasks from database when user is logged in
  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, [user]);

  // --- Auth Functions ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (error) {
      alert(error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // --- Check if task is overdue ---
  const isOverdue = (task) => {
    if (!task.date || !task.time) return false;
    const taskDateTime = new Date(`${task.date}T${task.time}`);
    return taskDateTime < new Date() && !task.completed;
  };

  // --- Format date for display ---
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // --- Format time for display ---
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // --- Task Functions (CRUD) ---
  const handleAddTask = async () => {
    if (taskText.trim() === '' || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        text: taskText,
        date: taskDate,
        time: taskTime,
        completed: false,
        createdAt: Date.now()
      });
      setTaskText('');
      setTaskDate('');
      setTaskTime('');
    } catch (error) {
      alert('Error adding task: ' + error.message);
    }
    setLoading(false);
  };

  const handleDeleteTask = async (idToDelete) => {
    try {
      await deleteDoc(doc(db, 'tasks', idToDelete));
    } catch (error) {
      alert('Error deleting task: ' + error.message);
    }
  };

  const handleToggleTask = async (idToToggle, currentCompleted) => {
    try {
      const taskRef = doc(db, 'tasks', idToToggle);
      await updateDoc(taskRef, { completed: !currentCompleted });
    } catch (error) {
      alert('Error updating task: ' + error.message);
    }
  };

  const handleEditTask = async (idToEdit) => {
    const currentTask = tasks.find((task) => task.id === idToEdit);
    const newText = prompt('Edit your task:', currentTask ? currentTask.text : '');

    if (!newText || newText.trim() === '') return;

    try {
      const taskRef = doc(db, 'tasks', idToEdit);
      await updateDoc(taskRef, { text: newText });
    } catch (error) {
      alert('Error editing task: ' + error.message);
    }
  };

  // --- UI: Login Screen ---
  if (!user) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '400px', margin: '100px auto', textAlign: 'center', border: '1px solid #ccc', borderRadius: '10px' }}>
        <h2>{isLogin ? 'Login' : 'Create New Account'}</h2>
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: '10px', fontSize: '16px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '10px', fontSize: '16px' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '10px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <p style={{ marginTop: '15px', fontSize: '14px', color: '#666' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    );
  }

  // --- UI: Tasks Dashboard ---
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Quick Tasks Panel</h2>
        <button onClick={handleLogout} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Welcome, {user.email}</p>

      {/* Add Task Form */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '15px' }}>Add New Task</h3>
        <input
          type="text"
          placeholder="Write your new task"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
        />
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Date:</label>
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Time:</label>
            <input
              type="time"
              value={taskTime}
              onChange={(e) => setTaskTime(e.target.value)}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <button
          onClick={handleAddTask}
          disabled={loading}
          style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
        >
          {loading ? 'Adding...' : 'Add Task'}
        </button>
      </div>

      {/* Tasks List */}
      <div>
        <h3 style={{ marginBottom: '15px' }}>Your Tasks ({tasks.length})</h3>
        {tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>No tasks yet. Add your first task above!</p>
        ) : (
          tasks.map((task) => {
            const overdue = isOverdue(task);
            return (
              <div
                key={task.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid #ccc',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '6px',
                  backgroundColor: task.completed ? '#f0fdf4' : (overdue ? '#fee2e2' : '#fff'),
                  borderLeft: overdue ? '4px solid #dc3545' : '4px solid #28a745'
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? '#888' : '#000',
                    fontSize: '16px',
                    display: 'block',
                    marginBottom: '5px'
                  }}>
                    {task.text}
                  </span>
                  {(task.date || task.time) && (
                    <span style={{
                      fontSize: '12px',
                      color: overdue ? '#dc3545' : '#666',
                      fontWeight: overdue ? 'bold' : 'normal'
                    }}>
                      {formatDate(task.date)} {task.time && `⏰ ${formatTime(task.time)}`}
                      {overdue && ' ⚠️ OVERDUE'}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '6px', marginLeft: '10px' }}>
                  <button onClick={() => handleToggleTask(task.id, task.completed)} style={{ padding: '6px 10px', color: 'black', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
                    {task.completed ? '️Undo' : 'Done'}
                  </button>
                  <button onClick={() => handleEditTask(task.id)} style={{ padding: '6px 10px', color: 'blue', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
                    Edit
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} style={{ padding: '6px 10px', color: 'red', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#fff' }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default App;