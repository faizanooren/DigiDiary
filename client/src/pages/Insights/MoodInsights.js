import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  BarChart3,
  Loader2,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import api from '../../utils/api';
import './MoodInsights.css';

const MoodInsights = () => {
  const [period, setPeriod] = useState('week');

  // Fetch mood insights data
  const { data: insightsData, isLoading, error } = useQuery(
    ['moodInsights', period],
    async () => {
      const response = await api.get(`/insights?period=${period}`);
      return response.data.data;
    },
    {
      onError: (error) => {
        console.error('Error fetching mood insights:', error);
        toast.error('Failed to load mood insights');
      },
      retry: 3,
      retryDelay: 1000,
      keepPreviousData: true
  });

  const getMoodEmoji = (score) => {
    if (score >= 7) return <Smile className="mood-emoji happy" />;
    if (score >= 4) return <Meh className="mood-emoji neutral" />;
    return <Frown className="mood-emoji sad" />;
  };

  const getMoodColor = (score) => {
    if (score >= 7) return '#10B981';
    if (score >= 4) return '#F59E0B';
    return '#EF4444';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatWeek = (week) => {
    return `Week ${week}`;
  };

  if (isLoading) {
    return (
      <div className="insights-container">
        <div className="loading-container">
          <Loader2 className="loading-spinner" />
          <p>Loading mood insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="insights-container">
        <div className="error-container">
          <p>Failed to load mood insights. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-container">
      <div className="insights-header">
        <div className="header-content">
          <h1>Mood Insights</h1>
          <p>Track your emotional journey and discover patterns</p>
        </div>
        
        <div className="period-selector">
          <button
            className={`period-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            <Calendar size={16} />
            Week
          </button>
          <button
            className={`period-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            <BarChart3 size={16} />
            Month
          </button>
        </div>
      </div>

      {insightsData && insightsData.totalEntries > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="insights-summary">
            <div className="summary-card">
              <div className="summary-icon">
                <TrendingUp size={24} />
              </div>
              <div className="summary-content">
                <h3>Average Mood</h3>
                <div className="summary-value">
                  {getMoodEmoji(insightsData.averageMood)}
                  <span className="mood-score">{insightsData.averageMood}/10</span>
                </div>
              </div>
            </div>

            {insightsData.highestMood && (
              <div className="summary-card">
                <div className="summary-icon happy">
                  <Smile size={24} />
                </div>
                <div className="summary-content">
                  <h3>Happiest Day</h3>
                  <div className="summary-value">
                    <span className="mood-score">{insightsData.highestMood.score}/10</span>
                    <p className="summary-date">{formatDate(insightsData.highestMood.date)}</p>
                  </div>
                </div>
              </div>
            )}

            {insightsData.lowestMood && (
              <div className="summary-card">
                <div className="summary-icon sad">
                  <Frown size={24} />
                </div>
                <div className="summary-content">
                  <h3>Lowest Day</h3>
                  <div className="summary-value">
                    <span className="mood-score">{insightsData.lowestMood.score}/10</span>
                    <p className="summary-date">{formatDate(insightsData.lowestMood.date)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="summary-card">
              <div className="summary-icon">
                <BarChart3 size={24} />
              </div>
              <div className="summary-content">
                <h3>Total Entries</h3>
                <div className="summary-value">
                  <span className="mood-score">{insightsData.totalEntries}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Mood Trend Chart */}
          <div className="chart-section">
            <h2>Mood Trend</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={insightsData.moodTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey={period === 'month' ? 'week' : 'date'} 
                    tickFormatter={period === 'month' ? formatWeek : formatDate}
                  />
                  <YAxis domain={[0, 10]} />
                  <Tooltip 
                    formatter={(value) => [`${value}/10`, 'Mood']}
                    labelFormatter={period === 'month' ? formatWeek : formatDate}
                  />
                  <ReferenceLine y={insightsData.averageMood} label={{ value: 'Avg', position: 'right' }} stroke="#F59E0B" strokeDasharray="3 3" />
                  <Line 
                    type="monotone" 
                    dataKey="averageMood"
                    stroke="#87CEEB" 
                    strokeWidth={3}
                    dot={{ fill: '#87CEEB', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#87CEEB', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Insights */}
          <div className="detailed-insights">
            <h2>Detailed Insights</h2>
            
            {insightsData.highestMood && (
              <div className="insight-item positive">
                <div className="insight-icon">
                  <Smile size={20} />
                </div>
                <div className="insight-content">
                  <h4>Happiest Moment</h4>
                  <p>Your happiest day this {period} was {formatDate(insightsData.highestMood.date)} 
                     with a mood score of {insightsData.highestMood.score}/10.</p>
                  {insightsData.highestMood.title && (
                    <p className="insight-note">Journal entry: "{insightsData.highestMood.title}"</p>
                  )}
                </div>
              </div>
            )}

            {insightsData.lowestMood && (
              <div className="insight-item negative">
                <div className="insight-icon">
                  <Frown size={20} />
                </div>
                <div className="insight-content">
                  <h4>Challenging Day</h4>
                  <p>Your most challenging day this {period} was {formatDate(insightsData.lowestMood.date)} 
                     with a mood score of {insightsData.lowestMood.score}/10.</p>
                  {insightsData.lowestMood.title && (
                    <p className="insight-note">Journal entry: "{insightsData.lowestMood.title}"</p>
                  )}
                </div>
              </div>
            )}

            <div className="insight-item neutral">
              <div className="insight-icon">
                <TrendingUp size={20} />
              </div>
              <div className="insight-content">
                <h4>Mood Pattern</h4>
                <p>You've recorded {insightsData.totalEntries} mood entries this {period}, 
                   with an average mood of {insightsData.averageMood}/10.</p>
                {insightsData.averageMood >= 7 && (
                  <p className="insight-note">Great job! You're maintaining a positive outlook.</p>
                )}
                {insightsData.averageMood < 4 && (
                  <p className="insight-note">Consider reaching out to friends or professionals for support.</p>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">
            <BarChart3 size={48} />
          </div>
          <h3>No Mood Data Available</h3>
          <p>Start journaling with mood tracking to see your insights here.</p>
        </div>
      )}
    </div>
  );
};

export default MoodInsights; 