import axios from "axios";

const api = axios.create({ baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000" });

const TTL = 5 * 60 * 1000; // 5 minutes

function cached(key, apiFn, ttl = TTL) {
  try {
    const raw = localStorage.getItem(`cplens_api_${key}`);
    if (raw) {
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < ttl) return Promise.resolve({ data });
    }
  } catch {}
  return apiFn().then(res => {
    try { localStorage.setItem(`cplens_api_${key}`, JSON.stringify({ data: res.data, ts: Date.now() })); } catch {}
    return res;
  });
}

export const analyzeCodeforces   = (handle)   => cached(`cf:analyze:${handle}`,   () => api.get(`/api/codeforces/analyze/${handle}`));
export const getCFUser            = (handle)   => cached(`cf:user:${handle}`,      () => api.get(`/api/codeforces/user/${handle}`));
export const getCFContests        = (handle)   => cached(`cf:contests:${handle}`,  () => api.get(`/api/codeforces/contests/${handle}`));
export const analyzeLeetcode      = (username) => cached(`lc:analyze:${username}`, () => api.get(`/api/leetcode/analyze/${username}`));
export const analyzeCodechef      = (username) => cached(`cc:analyze:${username}`, () => api.get(`/api/codechef/analyze/${username}`));
export const getUpcomingContests  = ()         => cached(`contests:upcoming`,      () => api.get(`/api/contests/upcoming`), 10 * 60 * 1000);

// never cache — recommendations are cheap, study plan is POST
export const getCFRecommendations = (handle)   => api.get(`/api/recommendations/codeforces/${handle}`);
export const getLCRecommendations = (username) => api.get(`/api/recommendations/leetcode/${username}`);
export const getCCRecommendations = (username) => api.get(`/api/recommendations/codechef/${username}`);
export const getStudyPlan         = (payload)  => api.post(`/api/ai/study-plan`, payload);
