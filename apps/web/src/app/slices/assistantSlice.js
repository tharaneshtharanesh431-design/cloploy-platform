import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';

export const askAssistant = createAsyncThunk('assistant/ask', async (message, { getState }) => {
  const { provider, thread } = getState().assistant;
  const { data } = await api.post('/ai/assistant', { message, provider, thread });
  return { message, response: data.response };
});

const slice = createSlice({
  name: 'assistant',
  initialState: {
    thread: [{ role: 'assistant', content: 'I am Cloploy AI. Ask me about build failures, Kubernetes, Terraform, cost optimization, or security.' }],
    provider: 'auto',
    status: 'idle',
    error: null
  },
  reducers: {
    setProvider(state, action) {
      state.provider = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(askAssistant.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        // Pre-emptively push the user's message so they see it in the chat immediately
        state.thread.push({ role: 'user', content: action.meta.arg });
      })
      .addCase(askAssistant.fulfilled, (state, action) => {
        state.status = 'idle';
        // The user message is already pushed in pending, so only push assistant response
        state.thread.push({ role: 'assistant', content: action.payload.response });
      })
      .addCase(askAssistant.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
        state.thread.push({
          role: 'assistant',
          content: `Sorry, I encountered an error: ${action.error.message || 'Verification failed.'}. Please try asking again or check your environment variables.`
        });
      });
  }
});

export const { setProvider } = slice.actions;
export default slice.reducer;
