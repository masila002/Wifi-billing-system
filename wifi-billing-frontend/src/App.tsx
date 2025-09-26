import { useState } from 'react';
import './App.css';

const PACKAGE_OPTIONS = [
  { label: '24 Hours', value: '24hr', amount: 1 },
  { label: '1 Week', value: '1week', amount: 200 },
  { label: '1 Month', value: '1month', amount: 500 },
];

function App() {
  const [selectedPackage, setSelectedPackage] = useState<typeof PACKAGE_OPTIONS[0] | null>(null);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // For status checker
  const [statusPhone, setStatusPhone] = useState('');
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handlePackageSelect = (pkg: typeof PACKAGE_OPTIONS[0]) => {
    setSelectedPackage(pkg);
    setMessage(null);
    setPhone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!selectedPackage) {
      setMessage('Please select a package.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/billing/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          amount: selectedPackage.amount,
          packageType: selectedPackage.value,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Payment initiated! Please complete the payment on your phone.');
      } else {
        setMessage(data.error || 'Payment initiation failed.');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setAccessStatus(null);
    try {
      const res = await fetch(`http://localhost:3000/api/billing/access/${statusPhone}`);
      const data = await res.json();
      if (data.access) {
        setAccessStatus(
          `Access granted (${data.packageType}). Expires: ${new Date(data.expires).toLocaleString()}`
        );
      } else {
        setAccessStatus('No active access found for this number.');
      }
    } catch {
      setAccessStatus('Error checking access. Please try again.');
    }
    setChecking(false);
  };

  return (
    <div className="container">
      <h2>WiFi Packages</h2>
      {!selectedPackage ? (
        <div className="package-cards">
          {PACKAGE_OPTIONS.map(pkg => (
            <div
              key={pkg.value}
              className="package-card"
              onClick={() => handlePackageSelect(pkg)}
              tabIndex={0}
              role="button"
              style={{ cursor: 'pointer' }}
            >
              <h3>{pkg.label}</h3>
              <p>Price: KES {pkg.amount}</p>
            </div>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="selected-package">
            <strong>Selected Package:</strong> {selectedPackage.label} (KES {selectedPackage.amount})
            <button
              type="button"
              style={{ marginLeft: 16, fontSize: 12 }}
              onClick={() => setSelectedPackage(null)}
            >
              Change
            </button>
          </div>
          <div>
            <label>Phone Number:</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 2547XXXXXXXX"
              required
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </form>
      )}
      {message && <p>{message}</p>}

      <hr style={{ margin: '2rem 0' }} />

      <h3>Check Access Status</h3>
      <form onSubmit={handleCheckStatus}>
        <div>
          <label>Phone Number:</label>
          <input
            type="tel"
            value={statusPhone}
            onChange={e => setStatusPhone(e.target.value)}
            placeholder="e.g. 2547XXXXXXXX"
            required
          />
        </div>
        <button type="submit" disabled={checking}>
          {checking ? 'Checking...' : 'Check Status'}
        </button>
      </form>
      {accessStatus && <p>{accessStatus}</p>}
    </div>
  );
}

export default App;
