import React, { useState } from 'react';
import { useKeycloak } from '@react-keycloak/web';

interface Report {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  data: {
    usage: {
      dailyHours: number;
      weeklySteps: number;
      monthlyDistance: number;
      comfortLevel: number;
      batteryLife: number | null;
      lastCalibration: string;
    };
    activities: {
      primaryActivity: string;
      activityFrequency: number;
      maxWeightLifted: number | null;
      walkingSpeed: number | null;
      gripStrength: number | null;
    };
    maintenance: {
      lastService: string;
      nextServiceDue: string;
      wearLevel: number;
      adjustmentNeeded: boolean;
      partsReplacement: boolean;
    };
    userFeedback: {
      satisfaction: number;
      painLevel: number;
      mobilityImprovement: number;
      independenceLevel: number;
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
            <h2 className="text-xl font-semibold mb-4">Отчеты по протезам</h2>
            <div className="grid gap-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{report.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs ${
                      report.status === 'active' ? 'bg-green-100 text-green-800' :
                      report.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {report.status === 'active' ? 'Активен' :
                       report.status === 'maintenance' ? 'Обслуживание' :
                       'Требует замены'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Тип: {report.type}</p>
                  <p className="text-sm text-gray-600 mb-3">Создан: {new Date(report.createdAt).toLocaleString()}</p>
                  
                  {/* Usage Metrics */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Использование</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{report.data.usage.dailyHours}ч</div>
                        <div className="text-xs text-gray-600">Часов в день</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{report.data.usage.weeklySteps.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Шагов в неделю</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{report.data.usage.monthlyDistance}км</div>
                        <div className="text-xs text-gray-600">Дистанция в месяц</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{report.data.usage.comfortLevel}/10</div>
                        <div className="text-xs text-gray-600">Уровень комфорта</div>
                      </div>
                    </div>
                    {report.data.usage.batteryLife && (
                      <div className="mt-2 text-center">
                        <div className="text-sm font-medium">Батарея: {report.data.usage.batteryLife}ч</div>
                      </div>
                    )}
                  </div>

                  {/* Activities */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Активность</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-bold">{report.data.activities.primaryActivity}</div>
                        <div className="text-xs text-gray-600">Основная активность</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold">{report.data.activities.activityFrequency}</div>
                        <div className="text-xs text-gray-600">Раз в неделю</div>
                      </div>
                      {report.data.activities.maxWeightLifted && (
                        <div className="text-center">
                          <div className="text-sm font-bold">{report.data.activities.maxWeightLifted}кг</div>
                          <div className="text-xs text-gray-600">Макс. вес</div>
                        </div>
                      )}
                      {report.data.activities.walkingSpeed && (
                        <div className="text-center">
                          <div className="text-sm font-bold">{report.data.activities.walkingSpeed}м/с</div>
                          <div className="text-xs text-gray-600">Скорость ходьбы</div>
                        </div>
                      )}
                      {report.data.activities.gripStrength && (
                        <div className="text-center">
                          <div className="text-sm font-bold">{report.data.activities.gripStrength}Н</div>
                          <div className="text-xs text-gray-600">Сила захвата</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Feedback */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Обратная связь пользователя</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold">{'⭐'.repeat(report.data.userFeedback.satisfaction)}</div>
                        <div className="text-xs text-gray-600">Удовлетворенность</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{report.data.userFeedback.painLevel}/10</div>
                        <div className="text-xs text-gray-600">Уровень боли</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{report.data.userFeedback.mobilityImprovement}%</div>
                        <div className="text-xs text-gray-600">Улучшение мобильности</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{report.data.userFeedback.independenceLevel}%</div>
                        <div className="text-xs text-gray-600">Независимость</div>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-800 mb-2">Обслуживание</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-sm font-bold">{report.data.maintenance.wearLevel}%</div>
                        <div className="text-xs text-gray-600">Износ</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-bold ${report.data.maintenance.adjustmentNeeded ? 'text-red-600' : 'text-green-600'}`}>
                          {report.data.maintenance.adjustmentNeeded ? 'Требуется' : 'Не требуется'}
                        </div>
                        <div className="text-xs text-gray-600">Регулировка</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-bold ${report.data.maintenance.partsReplacement ? 'text-red-600' : 'text-green-600'}`}>
                          {report.data.maintenance.partsReplacement ? 'Требуется' : 'Не требуется'}
                        </div>
                        <div className="text-xs text-gray-600">Замена частей</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold">
                          {new Date(report.data.maintenance.nextServiceDue).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-600">Следующее обслуживание</div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-4 p-3 bg-gray-50 rounded">{report.data.summary}</p>
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