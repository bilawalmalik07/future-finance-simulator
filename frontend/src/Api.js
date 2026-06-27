import axios from 'axios';

const API = axios.create({
  baseURL: '',
});

export const checkUsername = (username) => API.get(`/api/auth/check/${username}`);
export const signup = (username) => API.post('/api/auth/signup', { username });
export const login = (username) => API.post('/api/auth/login', { username });
export const startSimulation = (userId) => API.post(`/api/simulation/start/${userId}`);
export const getFunFact = () => API.get('/api/fun-fact');
export const submitBudget = (budgetData) => API.post('/api/budget/submit', budgetData);
export const updateCreditScore = (simulationId) => API.post(`/api/credit/update/${simulationId}`);
export const triggerEvent = (simulationId, monthNumber) => API.post(`/api/events/trigger/${simulationId}/${monthNumber}`);
export const getSimulationSummary = (simulationId) => API.get(`/api/simulation/summary/${simulationId}`);

export default API;