import axios from 'axios';

// Create an axios instance pointing to your local FastAPI backend
// (Change 8000 if your FastAPI backend runs on a different port like 8080)
const API = axios.create({
  baseURL: 'http://localhost:8000', 
});

// Authentication Routes
export const checkUsername = (username) => API.get(`/check-username?username=${username}`);
export const signup = (username) => API.post('/signup', { username });
export const login = (username) => API.post('/login', { username });

// Simulation Routes
export const startSimulation = (userId) => API.post('/simulation/start', { user_id: userId });
export const getFunFact = () => API.get('/fun-fact');

// Budget & Credit Score Routes
export const submitBudget = (budgetData) => API.post('/budget/submit', budgetData);
export const updateCreditScore = (simulationId) => API.post(`/credit/update/${simulationId}`);

export default API;