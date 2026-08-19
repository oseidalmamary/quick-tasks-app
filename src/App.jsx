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
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and sign up
  const [loading, setLoading] = useState(false);

  // --- Tasks State ---
  const [taskText, setTaskText] = useState('');
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

    // Fetch only this user's tasks, ordered newest to oldest
    // Fetch only this user's tasks (temporarily without orderBy)
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

  // --- Auth Functions (Login / Sign Up) ---
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

  // --- Task Functions (CRUD) ---
  const handleAddTask = async () => {
    if (taskText.trim() === '' || !user) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        text: taskText,
        completed: false,
        createdAt: Date.now()
      });
      setTaskText('');
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
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '440px', margin: 'auto', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Quick Tasks Panel</h2>
        <button onClick={handleLogout} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>Welcome, {user.email}</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Write your new task"
          value={taskText}
          onChange={(e) => setTaskText(e.target.value)}
          style={{ flex: '1', padding: '8px' }}
        />
        <button onClick={handleAddTask} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>
          {loading ? '...' : 'Add'}
        </button>
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
          <span style={{ textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#888' : '#000' }}>
            {task.text}
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => handleToggleTask(task.id, task.completed)} style={{ padding: '4px 8px', color: 'black', cursor: 'pointer' }}>
              {task.completed ? 'Undo' : 'Done'}
            </button>
            <button onClick={() => handleEditTask(task.id)} style={{ padding: '4px 8px', color: 'blue', cursor: 'pointer' }}>
              Edit
            </button>
            <button onClick={() => handleDeleteTask(task.id)} style={{ padding: '4px 8px', color: 'red', cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;