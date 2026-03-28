import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { RefreshCw, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

interface MetricsData {
  demand_metrics: {
    mae: number;
    rmse: number;
    r2_score: number;
  };
  turnover_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
  };
  last_training_timestamp: string | null;
}

interface AxiosError {
  response?: {
    data?: {
      detail?: string;
    };
  };
  message?: string;
}

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrainingInProgress, setRetrainingInProgress] = useState(false);
  const [nextRetrainTime, setNextRetrainTime] = useState<string | null>(null);

  const token = localStorage.getItem('token');
  const csrf_token = localStorage.getItem('csrf_token');

  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/ml/evaluate`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrf_token,
        },
      });

      if (response.data.status === 'success') {
        setMetrics(response.data.report);
        setError(null);
      }
    } catch (err: unknown) {
      const error = err as AxiosError;
      console.error('Failed to fetch metrics:', error);
      setError(error.response?.data?.detail || error.message || 'Failed to load model metrics');
      toast.error('Failed to load model metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    try {
      setRetrainingInProgress(true);
      const response = await axios.post(`${API_BASE_URL}/ml/train`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-CSRF-Token': csrf_token,
        },
      });

      if (response.data.status === 'success') {
        toast.success('Model retraining initiated successfully!');
        setTimeout(fetchMetrics, 2000);
      }
    } catch (err: unknown) {
      const error = err as AxiosError;
      toast.error(error.response?.data?.detail || error.message || 'Failed to trigger retraining');
    } finally {
      setRetrainingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="inline-block animate-spin">
              <RefreshCw className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="mt-4 text-gray-600">Loading model metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Error Loading Metrics</h2>
            </div>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={fetchMetrics}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const demandMetrics = metrics?.demand_metrics || { mae: 0, rmse: 0, r2_score: 0 };
  const turnoverMetrics = metrics?.turnover_metrics || { accuracy: 0, precision: 0, recall: 0, f1_score: 0 };
  const lastTraining = metrics?.last_training_timestamp;

  // Sample data for visualization (in real app, would come from backend)
  const metricsOverTime = [
    { date: '2024-01-01', mae: 2.5, rmse: 3.2, f1: 0.82 },
    { date: '2024-02-01', mae: 2.3, rmse: 3.0, f1: 0.84 },
    { date: '2024-03-01', mae: 2.1, rmse: 2.8, f1: 0.86 },
  ];

  const modelAccuracy = [
    { name: 'Demand\nForecast', value: parseFloat(String((demandMetrics.r2_score || 0.75) * 100)) },
    { name: 'Turnover\nPrediction', value: parseFloat(String((turnoverMetrics.accuracy || 0.82) * 100)) },
  ];

  const COLORS = ['#4f46e5', '#f59e0b'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ML Model Performance</h1>
          <p className="text-gray-600">Monitor model metrics, accuracy, and performance trends</p>
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              {lastTraining && (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Last Training:</span> {new Date(lastTraining).toLocaleString()}
                </p>
              )}
              {nextRetrainTime && (
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-semibold">Next Auto Retrain:</span> {new Date(nextRetrainTime).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={handleRetrain}
              disabled={retrainingInProgress}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <RefreshCw className={`w-4 h-4 ${retrainingInProgress ? 'animate-spin' : ''}`} />
              {retrainingInProgress ? 'Retraining...' : 'Retrain Now'}
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Demand Forecast MAE */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Demand MAE</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(demandMetrics.mae || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Lower is better</p>
          </div>

          {/* Demand Forecast RMSE */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Demand RMSE</h3>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {(demandMetrics.rmse || 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Lower is better</p>
          </div>

          {/* Demand R² */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Demand R²</h3>
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {((demandMetrics.r2_score || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Higher is better</p>
          </div>

          {/* Turnover F1 Score */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Turnover F1</h3>
              <CheckCircle className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {((turnoverMetrics.f1_score || 0) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500 mt-2">Higher is better</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Demand Model Metrics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Demand Forecast Metrics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[demandMetrics]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="mae" fill="#4f46e5" name="MAE" />
                <Bar dataKey="rmse" fill="#f59e0b" name="RMSE" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Turnover Model Metrics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Turnover Prediction Metrics</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[turnoverMetrics]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#10b981" name="Accuracy" />
                <Bar dataKey="precision" fill="#8b5cf6" name="Precision" />
                <Bar dataKey="recall" fill="#06b6d4" name="Recall" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Metrics Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Detailed Model Metrics</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Demand Metrics */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Demand Forecasting Model</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">Mean Absolute Error</td>
                    <td className="py-2 font-semibold text-gray-900">{(demandMetrics.mae || 0).toFixed(4)}</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">Root Mean Square Error</td>
                    <td className="py-2 font-semibold text-gray-900">{(demandMetrics.rmse || 0).toFixed(4)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">R² Score</td>
                    <td className="py-2 font-semibold text-gray-900">{((demandMetrics.r2_score || 0) * 100).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Turnover Metrics */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-4">Turnover Prediction Model</h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">Accuracy</td>
                    <td className="py-2 font-semibold text-gray-900">{((turnoverMetrics.accuracy || 0) * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">Precision</td>
                    <td className="py-2 font-semibold text-gray-900">{((turnoverMetrics.precision || 0) * 100).toFixed(2)}%</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 text-gray-600">Recall</td>
                    <td className="py-2 font-semibold text-gray-900">{((turnoverMetrics.recall || 0) * 100).toFixed(2)}%</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-gray-600">F1 Score</td>
                    <td className="py-2 font-semibold text-gray-900">{((turnoverMetrics.f1_score || 0) * 100).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Model Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">About These Metrics</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li><strong>MAE (Mean Absolute Error):</strong> Average prediction error in absolute value</li>
            <li><strong>RMSE (Root Mean Square Error):</strong> Standard deviation of prediction errors</li>
            <li><strong>R² Score:</strong> Proportion of variance explained (0-1 scale, higher is better)</li>
            <li><strong>F1 Score:</strong> Harmonic mean of precision and recall (0-1 scale, higher is better)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
