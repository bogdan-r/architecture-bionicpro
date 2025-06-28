import React, { useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';

interface Report {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  data: {
    metrics: {
      totalUsers: number;
      activeUsers: number;
      sessions: number;
      conversionRate: string;
    };
    summary: string;
  };
}

interface ApiResponse {
  success: boolean;
  data: Report[];
  user: {
    username: string;
    email: string;
    roles: string[];
  };
  timestamp: string;
}

const ReportPage: React.FC = () => {
  const { keycloak, initialized } = useKeycloak();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);

  const downloadReport = async () => {
    if (!keycloak?.token) {
      setError('Not authenticated');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.REACT_APP_API_URL}/reports`, {
        headers: {
          'Authorization': `Bearer ${keycloak.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setReports(data.data);
      setUserInfo(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!keycloak.authenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <button
          onClick={() => keycloak.login()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Usage Reports</h1>
          <div className="text-sm text-gray-600">
            Welcome, {keycloak.tokenParsed?.preferred_username || 'User'}
            <button
              onClick={() => keycloak.logout()}
              className="ml-4 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>

        {userInfo && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">User Information:</h3>
            <p><strong>Username:</strong> {userInfo.username}</p>
            <p><strong>Email:</strong> {userInfo.email}</p>
            <p><strong>Roles:</strong> {userInfo.roles.join(', ')}</p>
          </div>
        )}
        
        <button
          onClick={downloadReport}
          disabled={loading}
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Generating Report...' : 'Download Report'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {reports.length > 0 && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Generated Reports</h2>
            <div className="grid gap-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{report.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      report.status === 'completed' ? 'bg-green-100 text-green-800' :
                      report.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Type: {report.type}</p>
                  <p className="text-sm text-gray-600 mb-3">Created: {new Date(report.createdAt).toLocaleString()}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div className="text-center">
                      <div className="text-lg font-bold">{report.data.metrics.totalUsers}</div>
                      <div className="text-xs text-gray-600">Total Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{report.data.metrics.activeUsers}</div>
                      <div className="text-xs text-gray-600">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{report.data.metrics.sessions}</div>
                      <div className="text-xs text-gray-600">Sessions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">{report.data.metrics.conversionRate}%</div>
                      <div className="text-xs text-gray-600">Conversion Rate</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700">{report.data.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;