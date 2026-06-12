import axios from "axios";

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000" });

export const analyzeCodeforces = (handle) => api.get(`/api/codeforces/analyze/${handle}`);
export const getCFUser = (handle) => api.get(`/api/codeforces/user/${handle}`);
export const getCFContests = (handle) => api.get(`/api/codeforces/contests/${handle}`);
export const getCFRecommendations = (handle) => api.get(`/api/recommendations/codeforces/${handle}`);
export const getLCRecommendations = (username) => api.get(`/api/recommendations/leetcode/${username}`);
export const getCCRecommendations = (username) => api.get(`/api/recommendations/codechef/${username}`);
export const analyzeLeetcode = (username) => api.get(`/api/leetcode/analyze/${username}`);
export const analyzeCodechef = (username) => api.get(`/api/codechef/analyze/${username}`);
export const getStudyPlan        = (payload) => api.post(`/api/ai/study-plan`, payload);
export const getUpcomingContests = ()        => api.get(`/api/contests/upcoming`);
