import api from './api';

export async function createApplication(jobId){
    const {data} =await api.post('/applications', {jobId});
    return data;
}

export async function getMyApplications() {
  const { data } = await api.get('/applications/my');
  return data;
}
