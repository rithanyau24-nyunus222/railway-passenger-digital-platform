import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import LiveStatusTimeline from '../components/LiveStatusTimeline';
import { 
  Radio, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Train, 
  Clock, 
  MapPin,
  CheckCircle2
} from 'lucide-react';

export default function LiveTrainStatusPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTrainId = searchParams.get('trainId') || '';

  const [trainList, setTrainList] = useState([]);
  const [selectedTrainId, setSelectedTrainId] = useState(queryTrainId);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [trainStatus, setTrainStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Load available trains list for quick picker
  useEffect(() => {
    api.getAllTrains()
      .then((trains) => {
        setTrainList(trains);
        if (!selectedTrainId && trains.length > 0) {
          setSelectedTrainId(trains[0].trainId || trains[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const fetchStatus = async (trainId, isManualRefresh = false) => {
    if (!trainId) return;
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const data = await api.getTrainStatus(trainId);
      setTrainStatus(data);
    } catch (err) {
      setError(err.message || 'Unable to retrieve train status.');
      setTrainStatus(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedTrainId) {
      fetchStatus(selectedTrainId);
      setSearchParams({ trainId: selectedTrainId });
    }
  }, [selectedTrainId]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    const match = trainList.find(
      (t) =>
        t.trainNumber.toLowerCase() === searchQuery.trim().toLowerCase() ||
        t.trainName.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );

    if (match) {
      setSelectedTrainId(match.trainId || match.id);
    } else {
      fetchStatus(searchQuery.trim());
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '960px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 700 }}>
            <Radio size={16} />
            <span>REAL-TIME SATELLITE & STATION TELEMETRY</span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)' }}>Live Train Running Radar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem' }}>
            Real-time GPS tracking, station milestones, platform delays, and expected arrival times
          </p>
        </div>

        {trainStatus && (
          <button
            onClick={() => fetchStatus(selectedTrainId, true)}
            disabled={refreshing}
            className="btn btn-secondary btn-sm"
          >
            <RefreshCw size={15} className={refreshing ? 'spinner' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Radar'}</span>
          </button>
        )}
      </div>

      {/* Train Selector / Search Bar */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <form
          onSubmit={handleManualSearch}
          style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr auto',
            gap: '1rem',
            alignItems: 'flex-end'
          }}
          className="grid-responsive"
        >
          {/* Dropdown Selector */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="train-select">
              <Train size={15} color="var(--primary)" />
              <span>Select Active Railway Service</span>
            </label>
            <select
              id="train-select"
              className="form-control"
              value={selectedTrainId}
              onChange={(e) => setSelectedTrainId(e.target.value)}
            >
              {trainList.map((t) => (
                <option key={t.trainId || t.id} value={t.trainId || t.id}>
                  #{t.trainNumber} - {t.trainName} ({t.source} → {t.destination}) [{t.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Quick Number Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="train-num-search">
              <Search size={15} color="var(--primary)" />
              <span>Or Enter Train Number / Name</span>
            </label>
            <input
              id="train-num-search"
              type="text"
              className="form-control"
              placeholder="e.g. 12952 or Rajdhani"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '44px' }}>
              <Search size={16} />
              <span>Track</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error Feedback */}
      {error && (
        <div
          style={{
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--danger-border)',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.9rem'
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div className="spinner" style={{ width: 36, height: 36, marginBottom: '1rem' }} />
          <div style={{ color: 'var(--text-muted)' }}>Acquiring live telemetry data...</div>
        </div>
      ) : trainStatus ? (
        <LiveStatusTimeline trainStatus={trainStatus} />
      ) : (
        <div className="empty-state">
          <Train className="empty-icon" />
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>Select a train to inspect live radar</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Choose any scheduled service from the dropdown above to view real-time station progress.
          </p>
        </div>
      )}
    </div>
  );
}
