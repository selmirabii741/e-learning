import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(async (config) => {
  if (typeof window === 'undefined') return config;
  try {
    // Fast path 1: use token from authStore (set in-memory after KC auth success)
    const { useAuthStore } = await import('./authStore');
    const storedToken = useAuthStore.getState().token
      || sessionStorage.getItem('kc_token_cache'); // persists across page refreshes in same tab session

    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
      return config;
    }

    // Slow path: wait for KC to finish initialising (resolves in one shot, no polling)
    const { kcReady, getKeycloak } = await import('./keycloak');
    const timeout = new Promise(r => setTimeout(r, 3000)); // max 3s safety net
    await Promise.race([kcReady, timeout]);

    const kc = getKeycloak();
    if (kc?.authenticated) {
      const expiresIn = kc.tokenParsed?.exp
        ? kc.tokenParsed.exp - Math.floor(Date.now() / 1000)
        : 999;
      if (expiresIn < 30) {
        try { await kc.updateToken(30); } catch { /* ignore */ }
      }
      if (kc.token) {
        sessionStorage.setItem('kc_token_cache', kc.token);
        config.headers.Authorization = `Bearer ${kc.token}`;
      }
    }
  } catch (e) {
    console.error('API Interceptor error:', e);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Handle pending/rejected professor 403 — redirect to approval page silently
    if (error.response?.status === 403 && typeof window !== 'undefined') {
      const data = error.response?.data;
      if (data?.code === 'PROFESSOR_NOT_APPROVED') {
        const currentPath = window.location.pathname;
        if (currentPath !== '/pending-approval') {
          window.location.replace('/pending-approval');
        }
        // Suppress the error so it doesn't flood the console
        return new Promise(() => {}); // never resolves — page is redirecting
      }
    }
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      try {
        const { getKeycloak } = await import('./keycloak');
        const kc = getKeycloak();
        if (kc?.authenticated) {
          await kc.updateToken(30);
          error.config.headers.Authorization = `Bearer ${kc.token}`;
          return api.request(error.config);
        }
      } catch {
      }
      const { getKeycloak } = await import('./keycloak');
      getKeycloak()?.login();
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  me:            () => api.get('/auth/me'),
  sync:          () => api.post('/auth/keycloak-sync'),
  verifyEmail:   (token) => api.post('/auth/verify-email', { token }),
  setPassword:   (data)  => api.post('/auth/set-password', data),
  uploadCertificate: (formData) => api.post('/auth/upload-certificate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyVerification: () => api.get('/auth/my-verification'),
};

export const coursesAPI = {
  getAll: (params) => api.get('/courses', { params }),
  getCategories: () => api.get('/courses/categories'),
  search: (q) => api.get('/courses/search', { params: { q } }),
  getById: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  enroll: (id) => api.post(`/courses/${id}/enroll`),
  unenroll: (id) => api.delete(`/courses/${id}/unenroll`),
  addLesson: (courseId, data) => api.post(`/courses/${courseId}/lessons`, data),
  updateLesson: (courseId, lessonId, data) => api.put(`/courses/${courseId}/lessons/${lessonId}`, data),
  deleteLesson: (courseId, lessonId) => api.delete(`/courses/${courseId}/lessons/${lessonId}`),
  translateLesson: (courseId, lessonId, targetLang) =>
    api.post(`/courses/${courseId}/lessons/${lessonId}/translate`, { targetLang }),
  getCourseStudents: (courseId) => api.get(`/courses/${courseId}/students`),
  uploadLessonPDF: (courseId, lessonId, file) => {
    const formData = new FormData();
    formData.append('pdf', file);
    return api.post(`/courses/${courseId}/lessons/${lessonId}/upload-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getLessonPdf: (courseId, lessonId) =>
    api.get(`/courses/${courseId}/lessons/${lessonId}/pdf?format=base64`),
  getMyCourses: () => api.get('/courses/instructor/my'),

  // ── Secure join system ──
  joinByCode:     (code)        => api.post('/courses/join-by-code', { code }),
  regenerateCode: (courseId)    => api.post(`/courses/${courseId}/regenerate-code`),
  inviteStudent:  (courseId, email) => api.post(`/courses/${courseId}/invite`, { email }),
  getMyStudents:  ()             => api.get('/courses/instructor/my-students'),
  requestAccess:  (courseId, message) => api.post(`/courses/${courseId}/request-access`, { message }),
  getMyRequests:  ()             => api.get('/courses/my-requests'),
  getAccessRequests: (status)    => api.get(`/courses/instructor/access-requests${status ? `?status=${status}` : ''}`),
  approveRequest: (requestId)    => api.put(`/courses/access-requests/${requestId}/approve`),
  rejectRequest:  (requestId)    => api.put(`/courses/access-requests/${requestId}/reject`),
};

export const chatAPI = {
  ask: (courseId, question, history, lessonId) =>
    api.post(`/chat/${courseId}`, { question, history, lessonId }),
  uploadPdf: (courseId, file, lessonId) => {
    const formData = new FormData();
    formData.append('pdf', file);
    if (lessonId) formData.append('lessonId', lessonId);
    return api.post(`/chat/${courseId}/upload-pdf`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  generateSummary: (courseId, lessonId) => api.post(`/chat/${courseId}/summary`, { lessonId }),
  generateQuiz: (courseId, lessonId, difficulty = 'medium', count = 5) => api.post(`/chat/${courseId}/quiz`, { lessonId, difficulty, count }),
  getPdfStatus: (courseId, lessonId) => {
    const params = lessonId ? `?lessonId=${lessonId}` : '';
    return api.get(`/chat/${courseId}/pdf-status${params}`);
  },
  // ── RAG endpoints ──
  getRagStatus: (courseId) => api.get(`/rag/status/${courseId}`),
  ingestCourse: (courseId) => api.post(`/rag/ingest-course/${courseId}`),
  ingestLesson: (courseId, lessonId) => api.post(`/rag/ingest-lesson/${courseId}/${lessonId}`),
};

export const globalChatAPI = {
  getConversations: () => api.get('/global-chat/conversations'),
  createConversation: (title) => api.post('/global-chat/conversations', { title }),
  deleteConversation: (id) => api.delete(`/global-chat/conversations/${id}`),
  getMessages: (id) => api.get(`/global-chat/conversations/${id}/messages`),
  getDocuments: (id) => api.get(`/global-chat/conversations/${id}/documents`),
  sendMessage: (id, content, searchMode = 'document') => api.post(`/global-chat/conversations/${id}/messages`, { content, searchMode }),
  uploadDocument: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/global-chat/conversations/${id}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const aiAPI = {
  getLessonQuiz: (courseId, lessonId, count = 5, difficulty = 1) =>
    api.post('/ai/lesson-quiz', { courseId, lessonId, count, difficulty }),
  getLessonSummary: (courseId, lessonId) =>
    api.post('/ai/lesson-summary', { courseId, lessonId }),
};

export const quizAPI = {
  generate: (courseId, params) => api.post(`/quiz/${courseId}/generate`, params),
  submit:   (courseId, data)   => api.post(`/quiz/${courseId}/submit`, data),
};

export const progressAPI = {
  getMyProgress:    ()                    => api.get('/progress/me'),
  getCourseProgress: (courseId)           => api.get(`/progress/${courseId}`),
  completeLesson:   (courseId, lessonId)  => api.put(`/progress/${courseId}/lesson/${lessonId}`),
  uncompleteLesson: (courseId, lessonId)  => api.delete(`/progress/${courseId}/lesson/${lessonId}`),
  saveQuizScore:    (courseId, data)      => api.post(`/progress/${courseId}/quiz`, data),
};

export const studentAPI = {
  getProfile:       ()              => api.get('/students/me'),
  updateProfile:    (data)          => api.put('/students/me', data),
  uploadAvatar:     (avatarDataUrl) => api.put('/students/me', { avatar: avatarDataUrl }),
  getStats:         ()              => api.get('/students/me/stats'),
  changePassword:   (data)          => api.put('/students/me/password', data),
  getPreferences:   ()              => api.get('/students/me/preferences'),
  updatePreferences:(data)          => api.put('/students/me/preferences', data),
  deleteAccount:    ()              => api.delete('/students/me'),
};

export const adminAPI = {
  getStats:            ()         => api.get('/admin/stats'),
  getTeachers:         (params)   => api.get('/admin/teachers', { params }),
  getTeacher:          (id)       => api.get(`/admin/teachers/${id}`),
  createTeacher:       (data)     => api.post('/admin/teachers', data),
  updateTeacher:       (id, data) => api.put(`/admin/teachers/${id}`, data),
  deleteTeacher:       (id)       => api.delete(`/admin/teachers/${id}`),
  resendVerification:  (id)       => api.post(`/admin/teachers/${id}/resend-verification`),
  getTeacherCourses:   (id)       => api.get(`/admin/teachers/${id}/courses`),
  getStudents:         (params)   => api.get('/admin/students', { params }),
  deleteStudent:       (id)       => api.delete(`/admin/students/${id}`),
  getAdminCourses:     ()         => api.get('/admin/courses'),
  togglePublish:       (id)       => api.put(`/admin/courses/${id}/toggle-publish`),
  // Professor verification management
  getVerifications:      (params)   => api.get('/admin/verifications', { params }),
  getVerification:       (id)       => api.get(`/admin/verifications/${id}`),
  approveVerification:   (id, data) => api.post(`/admin/verifications/${id}/approve`, data),
  rejectVerification:    (id, data) => api.post(`/admin/verifications/${id}/reject`, data),
};

export const messagesAPI = {
  send:             (data)   => api.post('/messages', data),
  getConversations: ()       => api.get('/messages/conversations'),
  getThread:        (userId) => api.get(`/messages/conversations/${userId}`),
  getUnreadCount:   ()       => api.get('/messages/unread-count'),
  deleteMessage:    (id)     => api.delete(`/messages/${id}`),
};

export const forumAPI = {
  getStats:   ()           => api.get('/forum/stats'),
  getPosts:   (params)     => api.get('/forum', { params }),
  getPost:    (id)         => api.get(`/forum/${id}`),
  createPost: (data)       => api.post('/forum', data),
  addReply:   (postId, data) => api.post(`/forum/${postId}/replies`, data),
  votePost:   (postId, dir)  => api.put(`/forum/${postId}/vote`, { dir }),
  voteReply:  (replyId, dir) => api.put(`/forum/replies/${replyId}/vote`, { dir }),
  acceptReply: (replyId)   => api.put(`/forum/replies/${replyId}/accept`),
  deletePost:  (id)        => api.delete(`/forum/${id}`),
  deleteReply: (replyId)   => api.delete(`/forum/replies/${replyId}`),
};

export default api;
