import './App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [newUserName, setNewUserName] = useState('');
  const [prevRanks, setPrevRanks] = useState({});
  const [claimHistory, setClaimHistory] = useState([]);
  const [userClaimHistory, setUserClaimHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [shakingUserId, setShakingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/users');
      const sortedUsers = res.data.sort((a, b) => b.totalPoints - a.totalPoints);
      const rankChanges = {};
      sortedUsers.forEach((user, index) => {
        if (prevRanks[user._id] !== undefined) {
          rankChanges[user._id] = prevRanks[user._id] - index - 1;
        }
      });
      setPrevRanks(rankChanges);
      setUsers(sortedUsers);

      const historyRes = await axios.get('http://localhost:5000/claim-history');
      setClaimHistory(historyRes.data);
    } catch (err) {
      console.error('Error fetching users:', err.message);
    }
  };

  const claimPoints = async (event) => {
    if (!selectedUserId) return alert('Please select a user first');
    try {
      const res = await axios.post('http://localhost:5000/claim-points', { userId: selectedUserId });
      const claimedPoints = res.data.claimedPoints;

     
      const btn = event.target.getBoundingClientRect();
      addPointsAnimation(claimedPoints, btn.left + btn.width / 2, btn.top);

      setShakingUserId(selectedUserId);
      alert(`Claimed ${claimedPoints} points!`);
      fetchUsers();

    
      setTimeout(() => {
        setShakingUserId(null);
      }, 500); 
    } catch (err) {
      console.error('Error claiming points:', err.message);
    }
  };

  const addUser = async () => {
    if (!newUserName.trim()) return alert('Enter a valid name');
    if (users.some((user) => user.name.toLowerCase() === newUserName.toLowerCase())) {
      alert('User already exists!');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/users', { name: newUserName });
      setUsers([...users, res.data]);
      setNewUserName('');
      fetchUsers();
    } catch (err) {
      console.error('Error adding user:', err.message);
    }
  };

  const addPointsAnimation = (points, startX, startY) => {
    const pointEl = document.createElement('div');
    pointEl.classList.add('points');
    pointEl.textContent = `+${points}`;
    pointEl.style.left = `${startX}px`;
    pointEl.style.top = `${startY}px`;
    document.body.appendChild(pointEl);

    setTimeout(() => {
      pointEl.style.transform = 'translate(0, -100px)';
      pointEl.style.opacity = '0';
    }, 10);

    setTimeout(() => pointEl.remove(), 1500);
  };

  const showUserClaimHistory = (userId) => {
    const history = claimHistory.filter((claim) => claim.userId === userId);
    setUserClaimHistory(history);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUserClaimHistory([]);
  };

  return (
    <div className="app-container">
      <div className="container">
        <h1 className="heading">Leaderboard App</h1>

        <div className="form">
          <select className="input" onChange={(e) => setSelectedUserId(e.target.value)}>
            <option value="">Select a user</option>
            {users.map((user) => (
              <option key={user._id} value={user._id}>
                {user.name}
              </option>
            ))}
          </select>

          <input
            className="input"
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Add new user"
          />

          <button className="login-button" onClick={addUser}>
            Add User
          </button>
        </div>

        {selectedUserId && (
          <button className="login-button" onClick={claimPoints}>
            Claim Points
          </button>
        )}

        <div>
          <h2 className="heading">Leaderboard (Top 10)</h2>
          <table className="leaderboard">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Points</th>
                <th>Rank Change</th>
              </tr>
            </thead>
            <tbody>
              {users.slice(0, 10).map((user, index) => {
                const rankChange = prevRanks[user._id] - (index + 1);
                return (
                  <tr
                    key={user._id}
                    className={`${
                      shakingUserId === user._id ? 'shake' : ''
                    } ${rankChange > 0 ? 'rank-up' : rankChange < 0 ? 'rank-down' : ''}`}
                    onClick={() => showUserClaimHistory(user._id)}
                  >
                    <td>{index + 1}</td>
                    <td>{user.name}</td>
                    <td>{user.totalPoints}</td>
                    <td>
                      {rankChange > 0 && `⬆️ +${rankChange}`}
                      {rankChange < 0 && `⬇️ ${Math.abs(rankChange)}`}
                      {rankChange === 0 && '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>
              {userClaimHistory.length > 0
                ? users.find((user) => user._id === userClaimHistory[0].userId)?.name || 'User'
                : 'User'}{' '}
              's Claim History
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Claim Date</th>
                  <th>Points Claimed</th>
                </tr>
              </thead>
              <tbody>
                {userClaimHistory.map((claim, index) => (
                  <tr key={index}>
                    <td>{new Date(claim.timestamp).toLocaleString()}</td>
                    <td>{claim.claimedPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="login-button" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
