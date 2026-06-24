import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../api/client';

export const fetchProjects = createAsyncThunk('projects/fetchProjects', async () => {
  const { data } = await api.get('/projects');
  return data.projects;
});

export const runDeployment = createAsyncThunk('projects/runDeployment', async (projectId) => {
  const { data } = await api.post(`/deployments/${projectId}/run`);
  return data.deployment;
});

export const fetchDeployments = createAsyncThunk('projects/fetchDeployments', async () => {
  const { data } = await api.get('/deployments');
  return data.deployments;
});

const slice = createSlice({
  name: 'projects',
  initialState: { projects: [], deployments: [], loading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects = action.payload;
        state.loading = false;
      })
      .addCase(fetchDeployments.fulfilled, (state, action) => {
        state.deployments = action.payload;
      })
      .addCase(runDeployment.fulfilled, (state, action) => {
        state.deployments.unshift(action.payload);
      });
  }
});

export default slice.reducer;
