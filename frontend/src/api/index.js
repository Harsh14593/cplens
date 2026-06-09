import axios from "axios";

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000" });

export const analyzeCodeforces = (handle) => api.get(`/api/codeforces/analyze/${handle}`);
export const analyzeLeetcode = (username) => api.get(`/api/leetcode/analyze/${username}`);
export const getCFUser = (handle) => api.get(`/api/codeforces/user/${handle}`);
export const getCFContests = (handle) => api.get(`/api/codeforces/contests/${handle}`);
